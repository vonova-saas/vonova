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
import { CreateLessonDto } from "@/types/api/lms/courses.type";
import { toast } from "sonner";
import { uploadMockFile } from "@/lib/mock-data/courses/storage";

interface NewLessonModalProps {
  courseId: string;
  chapterId: string;
}

export function NewLessonModal({ courseId, chapterId }: NewLessonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createLesson, actionLoading, error } = useCourseManagementStore();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
      chapterId: chapterId,
    },
  });

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video file must be less than 100MB");
      return;
    }

    setUploadingVideo(true);

    try {
      // Create local preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Upload to mock storage (base64)
      console.log("[NewLessonModal] Uploading video...", file.name, file.size);
      const uploadResult = await uploadMockFile(file, courseId, "new-lesson");
      console.log("[NewLessonModal] Video uploaded:", uploadResult);
      setVideoKey(uploadResult.objectKey);

      toast.success("Video uploaded successfully (key: " + uploadResult.objectKey + ")");
    } catch (err) {
      toast.error("Failed to upload video");
      console.error(err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    setVideoKey(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      videoKey: videoKey || undefined,
    };

    console.log("[NewLessonModal] Creating lesson with data:", lessonData);

    const result = await createLesson(courseId, chapterId, lessonData);

    console.log("[NewLessonModal] Lesson created:", result);

    if (result) {
      toast.success("Lesson created successfully");
      form.reset();
      setVideoPreview(null);
      setVideoKey(null);
      setIsOpen(false);
    } else if (error) {
      toast.error(error);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
      setVideoPreview(null);
      setVideoKey(null);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-center gap-1">
          <Plus className="size-4" /> New Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
                    <Input placeholder="Enter lesson name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Video Upload Section */}
            <FormItem>
              <FormLabel>Video (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {!videoPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Video className="size-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Click to upload video</p>
                          <p className="text-sm text-muted-foreground">
                            MP4, WebM, or OGG (max 100MB)
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
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
                          <span className="text-sm font-medium">Video selected</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeVideo}
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

                  {uploadingVideo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Uploading video...
                    </div>
                  )}
                </div>
              </FormControl>
            </FormItem>

            <DialogFooter>
              <Button
                disabled={actionLoading || uploadingVideo}
                type="submit"
              >
                {actionLoading ? "Saving..." : "Create Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
