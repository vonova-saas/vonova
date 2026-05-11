"use client";

import Link from "next/link";
import { LessonContentType } from "./data/get-lesson-content";
import { RnderDescription } from "./rich-text-editor/rnder-description";
import { Button } from "@/components/ui/button";
import useConstructUrl from "@/hooks/courses/use-construct-url";
import useUserId from "@/hooks/user/use-user-id";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  BookIcon,
  BookOpen,
  CheckCircle,
  ExternalLink,
  FileText,
  ImageIcon,
  ListChecks,
  Loader2,
  Play,
  Presentation,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/courses/use-confetti";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markLessonCompleteMutationFn } from "@/services/student/lms/courses/real-courses.api";
import {
  fetchMaterialSignedViewUrl,
  materialSignedViewQueryKey,
  MATERIAL_SIGNED_VIEW_STALE_MS,
  type InstructorLibraryEditorRow,
} from "@/services/api/shared/material-library/material.api";
import type { LessonContentResourceItem } from "@/services/student/lms/courses/real-courses.api";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import { cn } from "@/lib/utils";
import { ProtectedMediaModal } from "@/components/shared/protected-media/protected-media-modal";
import { useProtectedMediaViewer } from "@/components/shared/protected-media/use-protected-media-viewer";

interface iAppProps {
  data: LessonContentType;
  /** Re-fetch lesson content (e.g. after transient presign failure). */
  onRetryLessonContent?: () => void;
  /** After progress is saved (e.g. bump lesson page reload key). */
  onAfterMarkComplete?: () => void;
}

export function CourseContent({
  data,
  onRetryLessonContent,
  onAfterMarkComplete,
}: iAppProps) {
  const { triggerConfetti } = useConfetti();
  const queryClient = useQueryClient();
  const auth = useAuthContextOptional();
  const viewer = {
    name: auth?.user?.name ?? null,
    email: (auth?.user as { email?: string } | undefined)?.email ?? null,
    id: (auth?.user as { _id?: string } | undefined)?._id ?? null,
  };
  const protectedMedia = useProtectedMediaViewer();

  const isCompleted = data.lessonProgress.some(
    (p) => p.lessonId === data.id && p.completed,
  );

  const markMutation = useMutation({
    mutationFn: () =>
      markLessonCompleteMutationFn(data.courseId, data.id, {
        completed: true,
      }),
    onSuccess: () => {
      toast.success("Lesson marked as complete");
      const { courseId, id: lessonId } = data;
      queryClient.invalidateQueries({ queryKey: coursesKeys.progress(courseId) });
      queryClient.invalidateQueries({ queryKey: coursesKeys.contentTree(courseId) });
      queryClient.invalidateQueries({
        queryKey: coursesKeys.lessonContent(courseId, lessonId),
      });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "courses" &&
          q.queryKey[1] === "sidebar",
      });
      queryClient.invalidateQueries({ queryKey: ["course-details"] });
      triggerConfetti();
      onAfterMarkComplete?.();
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessageFromUnknown(e));
    },
  });

  /** Derived fresh from mapped API `lesson.video` only (never lesson.type). */
  const lessonVideo = {
    streamUrl: data.videoStreamUrl ?? null,
    videoObjectKey: data.videoObjectKey ?? null,
  };

  function VideoPlayer({
    thumbnailKey,
    videoKey,
    videoObjectKey,
    videoStreamUrl,
    videoPosterUrl,
    onRetry,
  }: {
    thumbnailKey: string;
    videoKey: string;
    videoObjectKey?: string | null;
    videoStreamUrl?: string | null;
    videoPosterUrl?: string | null;
    onRetry?: () => void;
  }) {
    const legacyVideoUrl = useConstructUrl(videoKey);
    const legacyThumbnailUrl = useConstructUrl(thumbnailKey);

    /** Presigned playback URL only — never mix with legacy URL for <video src>. */
    const streamUrl = (videoStreamUrl ?? "").trim();
    const posterFromApi = videoPosterUrl?.trim() || "";
    const storedKey = (videoObjectKey?.trim() || videoKey?.trim() || "") as string;

    if (streamUrl) {
      if (
        process.env.NODE_ENV === "development" &&
        typeof window !== "undefined"
      ) {
        console.log("STREAM URL:", streamUrl);
      }
      return (
        <ProtectedLessonVideo src={streamUrl} />
      );
    }

    const isVideoDataMissing =
      !!videoKey?.trim() &&
      !videoObjectKey?.trim() &&
      legacyVideoUrl === "/images/placeholder.svg";

    const streamTemporarilyUnavailable = !!videoObjectKey?.trim();

    if (!storedKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            This lesson does not have a video yet
          </p>
        </div>
      );
    }

    if (isVideoDataMissing) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-6">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-center mb-2">
            Video data is not available
          </p>
          <p className="text-sm text-muted-foreground text-center">
            The video was uploaded but the data could not be retrieved.<br />
            This may happen if the browser storage was cleared.<br />
            Try re-uploading the video in the instructor dashboard.
          </p>
        </div>
      );
    }

    if (streamTemporarilyUnavailable) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-4 p-6 text-center">
          <BookIcon className="size-16 text-primary" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Video temporarily unavailable</p>
            <p className="text-sm text-muted-foreground">
              Playback could not be started. This is usually temporary.
            </p>
          </div>
          {onRetry ? (
            <Button type="button" variant="secondary" onClick={onRetry}>
              <RefreshCw className="size-4 mr-2" />
              Retry
            </Button>
          ) : null}
        </div>
      );
    }

    const validPoster =
      posterFromApi ||
      (legacyThumbnailUrl && legacyThumbnailUrl !== "/images/placeholder.svg"
        ? legacyThumbnailUrl
        : undefined);

    return (
      <ProtectedLessonVideo src={legacyVideoUrl} poster={validPoster} />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        key={`${data.id}-${(lessonVideo.streamUrl ?? "").trim() || "no-stream"}`}
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
        videoObjectKey={lessonVideo.videoObjectKey}
        videoStreamUrl={lessonVideo.streamUrl}
        videoPosterUrl={data.videoPosterUrl}
        onRetry={onRetryLessonContent}
      />

      <div className="py-4 border-b">
        {isCompleted ? (
          <Button variant="outline" className="bg-green-500/10 text-green-500 hover:text-green-600">
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => markMutation.mutate()}
            disabled={markMutation.isPending}
          >
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Mark as complete
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data.title}
        </h1>
        {data.description && (() => {
          try {
            const parsed = JSON.parse(data.description);
            return <RnderDescription json={parsed} />;
          } catch {
            return <p className="text-muted-foreground">{data.description}</p>;
          }
        })()}
      </div>

      <LessonResourcesPanel
        resources={data.lessonResources}
        onOpenMaterial={(m) =>
          protectedMedia.openMaterial({
            materialId: m.id,
            materialType: (m.materialType ?? "book") as
              | "book"
              | "guide"
              | "presentation",
            title: m.title,
            subtitle: data.title,
          })
        }
      />

      <ProtectedMediaModal
        open={protectedMedia.state.open}
        onOpenChange={protectedMedia.setOpen}
        url={protectedMedia.state.url}
        title={protectedMedia.state.title}
        subtitle={protectedMedia.state.subtitle}
        kind={protectedMedia.state.kind}
        loading={protectedMedia.state.loading}
        viewer={viewer}
      />
    </div>
  );
}

function ProtectedLessonVideo({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  return (
    <div className="aspect-video min-h-48 rounded-lg relative overflow-hidden bg-black">
      <video
        key={src}
        src={src}
        controls
        preload="metadata"
        playsInline
        poster={poster}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="block h-full w-full min-h-48 object-contain bg-black"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

type ResourceKind = "material" | "quiz" | "problem";

const SECTION_META: Record<
  ResourceKind,
  { title: string; description: string; icon: typeof FileText; accent: string }
> = {
  material: {
    title: "Materials",
    description: "Open downloadable books, slides, and reading material.",
    icon: FileText,
    accent: "text-sky-600 dark:text-sky-400",
  },
  quiz: {
    title: "Quizzes",
    description: "Test what you learned and earn a score.",
    icon: ListChecks,
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  problem: {
    title: "Problem Solving",
    description: "Practice with coding challenges tied to this lesson.",
    icon: Puzzle,
    accent: "text-violet-600 dark:text-violet-400",
  },
};

const MATERIAL_TINT: Record<
  NonNullable<InstructorLibraryEditorRow["viewType"]>,
  { icon: typeof BookOpen; chip: string }
> = {
  book: {
    icon: BookOpen,
    chip: "bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400",
  },
  guide: {
    icon: ImageIcon,
    chip:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400",
  },
  presentation: {
    icon: Presentation,
    chip:
      "bg-orange-500/10 text-orange-600 border-orange-500/25 dark:text-orange-400",
  },
};

function LessonResourcesPanel({
  resources,
  onOpenMaterial,
}: {
  resources: LessonContentType["lessonResources"];
  onOpenMaterial: (item: LessonContentResourceItem) => void;
}) {
  const userId = useUserId();
  const r = resources ?? { materials: [], quizzes: [], problems: [] };
  const total = r.materials.length + r.quizzes.length + r.problems.length;
  if (total === 0) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-linear-to-br from-card via-card to-muted/30 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">
              Lesson resources
            </h2>
            <p className="text-xs text-muted-foreground">
              {total} item{total === 1 ? "" : "s"} attached to this lesson
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
          {r.materials.length > 0 && (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-600 dark:text-sky-400">
              {r.materials.length} material{r.materials.length === 1 ? "" : "s"}
            </span>
          )}
          {r.quizzes.length > 0 && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
              {r.quizzes.length} quiz{r.quizzes.length === 1 ? "" : "zes"}
            </span>
          )}
          {r.problems.length > 0 && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-violet-600 dark:text-violet-400">
              {r.problems.length} problem{r.problems.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6 p-5">
        {r.materials.length > 0 && (
          <ResourceSection
            kind="material"
            items={r.materials}
            renderItem={(item) => (
              <MaterialCard
                key={item.id}
                item={item}
                onOpen={() => onOpenMaterial(item)}
              />
            )}
          />
        )}
        {r.quizzes.length > 0 && (
          <ResourceSection
            kind="quiz"
            items={r.quizzes}
            renderItem={(item) => (
              <QuizCard key={item.id} item={item} userId={userId} />
            )}
          />
        )}
        {r.problems.length > 0 && (
          <ResourceSection
            kind="problem"
            items={r.problems}
            renderItem={(item) => (
              <ProblemCard key={item.id} item={item} userId={userId} />
            )}
          />
        )}
      </div>
    </section>
  );
}

function ResourceSection({
  kind,
  items,
  renderItem,
}: {
  kind: ResourceKind;
  items: LessonContentResourceItem[];
  renderItem: (item: LessonContentResourceItem) => React.ReactNode;
}) {
  const meta = SECTION_META[kind];
  const Icon = meta.icon;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", meta.accent)} />
          <h3 className="text-sm font-semibold">{meta.title}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {meta.description}
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">{items.map(renderItem)}</ul>
    </div>
  );
}

function MaterialCard({
  item,
  onOpen,
}: {
  item: LessonContentResourceItem;
  onOpen: () => void;
}) {
  const materialType = (item.materialType ?? "book") as
    | "book"
    | "guide"
    | "presentation";
  const tint = MATERIAL_TINT[materialType] ?? MATERIAL_TINT.book;
  const Icon = tint.icon;

  // Warm the signed-view cache so the protected modal opens with no spinner.
  const prefetch = useQuery({
    queryKey: materialSignedViewQueryKey(item.id, materialType),
    queryFn: () => fetchMaterialSignedViewUrl(item.id, materialType),
    staleTime: MATERIAL_SIGNED_VIEW_STALE_MS,
    gcTime: MATERIAL_SIGNED_VIEW_STALE_MS + 15 * 60 * 1000,
    retry: 2,
  });
  const ready = Boolean(prefetch.data?.data?.url);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              tint.chip,
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
              {materialType}
              {ready
                ? " • Open in protected viewer"
                : prefetch.isFetching
                  ? " • Preparing secure viewer…"
                  : prefetch.isError
                    ? " • Tap to retry"
                    : " • Click to open"}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {prefetch.isFetching && !ready ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              View
              <ExternalLink className="h-3.5 w-3.5" />
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function QuizCard({
  item,
  userId,
}: {
  item: LessonContentResourceItem;
  userId: string | undefined;
}) {
  const href = userId ? `/student/${userId}/quizzes/${item.id}` : "#";
  return (
    <li>
      <Link
        href={href}
        prefetch
        className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          >
            <ListChecks className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Quiz • Click to take it
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
          Start
          <Play className="h-3.5 w-3.5" />
        </span>
      </Link>
    </li>
  );
}

function ProblemCard({
  item,
  userId,
}: {
  item: LessonContentResourceItem;
  userId: string | undefined;
}) {
  const href = userId
    ? `/student/${userId}/problem-solving/${item.id}`
    : "#";
  return (
    <li>
      <Link
        href={href}
        prefetch
        className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
            aria-hidden
          >
            <Puzzle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Coding challenge • Click to solve
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
          Solve
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </Link>
    </li>
  );
}
