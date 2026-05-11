"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { lessonSchema, LessonSchemaType } from "@/lib/courses/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Video, X } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useCourseManagementStore } from "@/lib/stores";
import { CreateLessonDto, Lesson } from "@/types/api/lms/courses.type";
import { toast } from "sonner";
import {
  uploadLessonVideoViaPresignedPut,
  isAllowedLessonVideoFile,
  type LessonVideoUploadPhase,
} from "@/lib/lms/lesson-video-s3-upload";
import { Progress } from "@/components/ui/progress";
import { getLessonByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { queryClient } from "@/providers/providers";
import { coursesKeys } from "@/hooks/student/lms/use-courses";

interface NewLessonModalProps {
  courseId: string;
  chapterId: string;
}

type PipelinePhase =
  | "idle"
  | "creating_lesson"
  | "uploading_s3"
  | "confirming_upload"
  | "syncing_lesson";

const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 500;

async function waitForLessonVideoSynced(
  courseId: string,
  chapterId: string,
  lessonId: string,
): Promise<Lesson> {
  let last: Lesson | null = null;
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    const { data } = await getLessonByIdQueryFn(courseId, chapterId, lessonId);
    last = data;
    if (data.videoKey || data.streamUrl) {
      return data;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  if (last?.videoKey || last?.streamUrl) {
    return last;
  }
  throw new Error(
    "Upload completed but lesson video not synchronized (missing video key and stream URL).",
  );
}

function mapUploadPhaseToPipeline(
  p: LessonVideoUploadPhase,
): PipelinePhase {
  if (p === "confirm") return "confirming_upload";
  return "uploading_s3";
}

export function NewLessonModal({ courseId, chapterId }: NewLessonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createLesson, fetchCourseById, applyLessonSnapshot, actionLoading, error } =
    useCourseManagementStore();

  const pipelineBusy = pipelinePhase !== "idle";

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
      chapterId: chapterId,
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedLessonVideoFile(file)) {
      toast.error("Only MP4, MOV, or WebM lesson videos are allowed.");
      return;
    }

    // S3 single-PUT objects max out at 5 GB. Beyond that you'd need the
    // multipart upload API. Course videos (15 min – 2 h at typical bitrates)
    // comfortably fit under this cap, so a hard guard here is enough.
    const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(
        "Video file must be 5 GB or smaller. Re-encode to a lower bitrate (e.g. H.264 at 2–4 Mbps for 1080p) or split the lesson.",
      );
      return;
    }
    if (file.size === 0) {
      toast.error("Selected video file is empty (0 bytes). Pick another file.");
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    setPendingVideoFile(file);
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setPendingVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function phaseBannerText(): string {
    switch (pipelinePhase) {
      case "creating_lesson":
        return "Creating lesson…";
      case "uploading_s3":
        return `Uploading to AWS S3… ${uploadProgress}%`;
      case "confirming_upload":
        return "Confirming upload with LMS…";
      case "syncing_lesson":
        return "Finalizing lesson…";
      default:
        return "";
    }
  }

  async function onSubmit(values: LessonSchemaType) {
    const validation = lessonSchema.safeParse(values);
    if (!validation.success) {
      toast.error("Invalid lesson name");
      return;
    }

    const lessonData: CreateLessonDto = {
      title: values.name,
      index: 1,
      type: "VIDEO",
      previewable: false,
    };

    setPipelinePhase("creating_lesson");
    try {
      const result = await createLesson(courseId, chapterId, lessonData);

      if (!result) {
        if (error) toast.error(error);
        return;
      }

      if (pendingVideoFile) {
        setUploadingVideo(true);
        setUploadProgress(0);
        try {
          await uploadLessonVideoViaPresignedPut(
            courseId,
            chapterId,
            result._id,
            pendingVideoFile,
            (pct) => setUploadProgress(pct),
            (p) => setPipelinePhase(mapUploadPhaseToPipeline(p)),
          );

          setPipelinePhase("syncing_lesson");
          const synced = await waitForLessonVideoSynced(
            courseId,
            chapterId,
            result._id,
          );

          if (!synced.videoKey && !synced.streamUrl) {
            throw new Error(
              "Upload completed but lesson video not synchronized",
            );
          }

          applyLessonSnapshot({
            ...synced,
            courseId: synced.courseId || courseId,
            chapterId: synced.chapterId || chapterId,
          });
          await fetchCourseById(courseId);

          queryClient.invalidateQueries({
            queryKey: ["instructor-course", courseId],
          });
          queryClient.invalidateQueries({
            queryKey: ["course-details", courseId],
          });
          queryClient.invalidateQueries({
            queryKey: coursesKeys.contentTree(courseId),
          });
          queryClient.invalidateQueries({
            queryKey: coursesKeys.lessonContent(courseId, result._id),
          });

          toast.success("Lesson created and video uploaded");
        } catch (err) {
          console.error(err);
          toast.error(
            err instanceof Error
              ? err.message
              : "Lesson was created, but the video failed to upload or sync. Open the lesson editor and try again.",
          );
          await fetchCourseById(courseId);
          return;
        } finally {
          setUploadingVideo(false);
          setUploadProgress(0);
        }
      } else {
        await fetchCourseById(courseId);
        queryClient.invalidateQueries({
          queryKey: ["instructor-course", courseId],
        });
        queryClient.invalidateQueries({
          queryKey: coursesKeys.contentTree(courseId),
        });
        toast.success("Lesson created successfully");
      }

      form.reset();
      removeVideo();
      setIsOpen(false);
    } finally {
      setPipelinePhase("idle");
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open && (pipelineBusy || actionLoading || uploadingVideo)) {
      toast.message(
        "Please wait",
        {
          description:
            "Uploading video to AWS S3… Please wait until upload completes.",
        },
      );
      return;
    }
    if (!open) {
      form.reset();
      removeVideo();
      setUploadingVideo(false);
      setUploadProgress(0);
      setPipelinePhase("idle");
    }
    setIsOpen(open);
  }

  const blockDismiss = pipelineBusy || actionLoading || uploadingVideo;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-center gap-1">
          <Plus className="size-4" /> New Lesson
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={!blockDismiss}
        onPointerDownOutside={(e) => {
          if (blockDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (blockDismiss) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (blockDismiss) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
          <DialogDescription>
            Add a lesson with optional video content
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter lesson name"
                      disabled={blockDismiss}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Video (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {!videoPreview ? (
                    <div
                      onClick={() => {
                        if (!blockDismiss) fileInputRef.current?.click();
                      }}
                      className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Video className="size-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Click to upload video</p>
                          <p className="text-sm text-muted-foreground">
                            MP4, MOV, or WebM (up to 5 GB). Upload runs after
                            the lesson is created and streams directly to S3.
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                        aria-label="Choose lesson video file"
                        onChange={handleVideoSelect}
                        disabled={blockDismiss}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded">
                            <Video className="size-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            Video selected
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeVideo}
                          disabled={blockDismiss}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <video
                        src={videoPreview}
                        className="w-full aspect-video rounded bg-black"
                        controls
                      />
                    </div>
                  )}

                  {blockDismiss && (
                    <div
                      role="status"
                      className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
                    >
                      <p className="font-medium">
                        Uploading video to AWS S3… Please wait until upload
                        completes.
                      </p>
                      {phaseBannerText() ? (
                        <p className="mt-1 text-muted-foreground">
                          {phaseBannerText()}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {(uploadingVideo || pipelinePhase === "syncing_lesson") && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        {phaseBannerText()}
                      </div>
                      <Progress value={uploadProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </FormControl>
            </FormItem>

            <DialogFooter>
              <Button disabled={blockDismiss} type="submit">
                {blockDismiss
                  ? pipelinePhase === "creating_lesson"
                    ? "Creating lesson…"
                    : uploadingVideo || pipelinePhase === "syncing_lesson"
                      ? phaseBannerText() || "Working…"
                      : "Working…"
                  : "Create Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
