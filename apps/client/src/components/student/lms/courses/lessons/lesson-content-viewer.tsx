"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonContent, LessonResource } from "@/types/api/lms/courses.type";
import {
  getLessonContentQueryFn,
  type LessonContentApiEnvelope,
} from "@/services/student/lms/courses/real-courses.api";
import { FileText, Download, Clock, RefreshCw } from "lucide-react";
import { sanitizeHtml } from "@/lib/safety";
import { logMediaClientFailure } from "@/lib/lms/media-client-telemetry";
import { isPresignedUrlExpired } from "@/lib/lms/presigned-url";
import {
  hostnameOnlyFromUrl,
  logLessonVideoRefresh,
  logMediaCacheExpired,
  logMediaRefresh,
  refreshSignedMediaUrl,
} from "@/lib/lms/signed-media-cache";
import { logLessonStreamRefresh } from "@/lib/lms/ensure-fresh-signed-media-url";
import { resolveStableMediaPlaybackUrl } from "@/lib/lms/stable-media-url";
import { normalizeLessonProgressionState } from "@/lib/lms/lesson-progression";

function mapEnvelopeToLessonContent(body: LessonContentApiEnvelope): LessonContent {
  const l = body.lesson;
  const r = l.resources;
  const flatResources =
    r != null
      ? [
          ...r.materials.map((m) => ({
            type: "PDF" as const,
            title: `${m.title} (${m.materialType ?? "material"})`,
            url: `#material-${m.id}`,
          })),
          ...r.quizzes.map((q) => ({
            type: "DOC" as const,
            title: q.title,
            url: `#quiz-${q.id}`,
          })),
          ...r.problems.map((p) => ({
            type: "DOC" as const,
            title: p.title,
            url: `#problem-${p.id}`,
          })),
        ]
      : [];
  return {
    _id: l.id,
    title: l.title,
    content: l.content ?? "",
    type: l.type as LessonContent["type"],
    durationMinutes: l.durationMinutes,
    resources: flatResources,
    isCompleted: false,
    progress: 0,
    videoStreamUrl: l.video?.streamUrl ?? undefined,
    videoObjectKey: l.video?.videoObjectKey ?? undefined,
    videoError: Boolean(l.video?.videoError),
    videoStreamError: l.video?.error ?? null,
    videoPosterUrl: l.video?.thumbnailUrl ?? l.video?.posterUrl,
    ...normalizeLessonProgressionState({
      watchedPercentage: l.watchedPercentage,
      canMarkComplete: l.canMarkComplete,
      hasVideo: l.hasVideo,
      watchThreshold: l.watchThreshold,
      completed: l.completed ?? l.lessonCompleted,
      accessible: body.access,
      locked: body.access === false,
      computedCompletionRequirements: l.computedCompletionRequirements,
    }),
  };
}

interface iAppProps {
  courseId: string;
  lessonId: string;
}

export function LessonContentViewer({ courseId, lessonId }: iAppProps) {
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [videoPlaybackFailed, setVideoPlaybackFailed] = useState(false);
  const [videoRemountKey, setVideoRemountKey] = useState(0);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackRefetchDoneRef = useRef(false);
  const streamUrlForVisibilityRef = useRef<string>("");

  useEffect(() => {
    streamUrlForVisibilityRef.current = (lessonContent?.videoStreamUrl ?? "").trim();
  }, [lessonContent?.videoStreamUrl]);

  /** New lesson / course: never show the previous lesson's stream or poster while the next loads. */
  useEffect(() => {
    setLessonContent(null);
    setVideoPlaybackFailed(false);
    setVideoRemountKey(0);
    playbackRefetchDoneRef.current = false;
    setError(null);
    setLoading(true);
  }, [courseId, lessonId]);

  /** Tab wake / long session: refetch lesson once if stream SigV4 is expired (debounced). */
  useEffect(() => {
    const debounceMs = 2500;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const u = streamUrlForVisibilityRef.current;
        if (u && isPresignedUrlExpired(u)) {
          logMediaRefresh({
            entityType: "lesson_video",
            courseId,
            lessonId,
            reason: "visibility_expired_stream",
          });
          setRetryCount((c) => c + 1);
        }
      }, debounceMs);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (timer) clearTimeout(timer);
    };
  }, [courseId, lessonId]);

  useEffect(() => {
    const onOnline = () => {
      const u = streamUrlForVisibilityRef.current;
      if (u && isPresignedUrlExpired(u)) {
        logLessonStreamRefresh({
          reason: "online_expired_stream",
          courseId,
          lessonId,
        });
        setRetryCount((c) => c + 1);
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [courseId, lessonId]);

  useEffect(() => {
    let cancelled = false;
    playbackRefetchDoneRef.current = false;

    async function fetchLessonContent() {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(() => {
        if (!cancelled) {
          setError("This lesson is taking too long to load. You can retry.");
          setLoading(false);
        }
      }, 45_000);
      try {
        setLoading(true);
        let envelope = await getLessonContentQueryFn(courseId, lessonId);
        if (cancelled) return;

        const streamUrlFirst = (envelope.lesson.video?.streamUrl ?? "").trim();
        let bumpedRemountForStaleUrl = false;
        if (streamUrlFirst && isPresignedUrlExpired(streamUrlFirst)) {
          logMediaCacheExpired({
            entityType: "lesson_video",
            courseId,
            lessonId,
            reason: "presigned_expired_before_play",
          });
          try {
            envelope = await refreshSignedMediaUrl(
              `lesson-content-stale:${courseId}:${lessonId}`,
              () => getLessonContentQueryFn(courseId, lessonId),
            );
            bumpedRemountForStaleUrl = true;
            logLessonVideoRefresh({
              courseId,
              lessonId,
              trigger: "stale_stream_url",
              refreshSuccess: true,
            });
          } catch {
            logLessonVideoRefresh({
              courseId,
              lessonId,
              trigger: "stale_stream_url",
              refreshSuccess: false,
            });
          }
        }

        if (cancelled) return;
        setLessonContent(mapEnvelopeToLessonContent(envelope));
        setVideoPlaybackFailed(false);
        if (bumpedRemountForStaleUrl) {
          setVideoRemountKey((k) => k + 1);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching lesson content:", err);
        setError("Failed to load lesson content");
      } finally {
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current);
          loadTimerRef.current = null;
        }
        if (!cancelled) setLoading(false);
      }
    }

    void fetchLessonContent();
    return () => {
      cancelled = true;
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [courseId, lessonId, retryCount]);

  if (loading) {
    return <LessonContentSkeleton />;
  }

  if (error || !lessonContent) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">{error || "Lesson content not available"}</p>
        </CardContent>
      </Card>
    );
  }

  /** Show video chrome when we have a playback URL or a stored key (not lesson.type). */
  const streamUrl = resolveStableMediaPlaybackUrl(
    (lessonContent.videoStreamUrl ?? "").trim(),
  );
  const posterUrl = resolveStableMediaPlaybackUrl(
    (lessonContent.videoPosterUrl ?? "").trim(),
  );
  const safePoster =
    posterUrl &&
    (/^https?:\/\//i.test(posterUrl) || posterUrl.startsWith("/api/v1/media/"))
      ? posterUrl
      : undefined;

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined" && streamUrl) {
    console.warn(
      "[LESSON_VIDEO_DEBUG]",
      JSON.stringify({
        courseId,
        lessonId,
        host: hostnameOnlyFromUrl(streamUrl),
      }),
    );
  }

  const apiVideoError = Boolean(lessonContent.videoError);
  const videoLayoutMode = !!(
    streamUrl ||
    lessonContent.videoObjectKey?.trim() ||
    apiVideoError
  );
  const blockPlayback = apiVideoError || videoPlaybackFailed;
  const bodyHtml = sanitizeHtml(lessonContent.content?.trim() ?? "");

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{lessonContent.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{lessonContent.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Type: {lessonContent.type}</span>
                </div>
                {lessonContent.progress > 0 && (
                  <div className="flex items-center gap-1">
                    <span>Progress: {Math.round(lessonContent.progress * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
            {lessonContent.isCompleted && (
              <Button variant="outline" className="text-green-600 border-green-600">
                ✓ Completed
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <Card>
        <CardContent className="p-6">
          {videoLayoutMode && (
            <div className="space-y-4">
              <div className="aspect-video min-h-48 bg-black rounded-lg overflow-hidden">
                {streamUrl && !blockPlayback ? (
                  <video
                    key={`${streamUrl}-${videoRemountKey}`}
                    src={streamUrl}
                    poster={safePoster}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    playsInline
                    className="block h-full w-full min-h-48 object-contain bg-black"
                    onError={() => {
                      logMediaClientFailure({
                        courseId,
                        lessonId,
                        mediaType: "lesson_video",
                        failedUrl: streamUrl,
                        reason: "html_video_error",
                      });
                      if (playbackRefetchDoneRef.current) {
                        setVideoPlaybackFailed(true);
                        return;
                      }
                      playbackRefetchDoneRef.current = true;
                      void (async () => {
                        try {
                          const envelope = await refreshSignedMediaUrl(
                            `lesson-video-playback:${courseId}:${lessonId}`,
                            () => getLessonContentQueryFn(courseId, lessonId),
                          );
                          const next = mapEnvelopeToLessonContent(envelope);
                          const nextStream = (next.videoStreamUrl ?? "").trim();
                          const urlChanged = Boolean(nextStream && nextStream !== streamUrl);
                          logLessonVideoRefresh({
                            courseId,
                            lessonId,
                            trigger: "html_video_error",
                            refreshSuccess: urlChanged || (!!nextStream && !streamUrl),
                          });
                          setLessonContent(next);
                          if (urlChanged) {
                            setVideoRemountKey((k) => k + 1);
                            setVideoPlaybackFailed(false);
                          } else {
                            setVideoPlaybackFailed(true);
                          }
                        } catch {
                          logLessonVideoRefresh({
                            courseId,
                            lessonId,
                            trigger: "html_video_error",
                            refreshSuccess: false,
                          });
                          setVideoPlaybackFailed(true);
                        }
                      })();
                    }}
                  />
                ) : streamUrl || lessonContent.videoObjectKey?.trim() || apiVideoError || videoPlaybackFailed ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {apiVideoError
                        ? "Video could not be prepared for playback"
                        : "Video temporarily unavailable"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lessonContent.videoStreamError?.reason
                        ? `Reason: ${lessonContent.videoStreamError.reason}`
                        : "Try again in a moment, or contact support if this persists."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setVideoPlaybackFailed(false);
                        setRetryCount((n) => n + 1);
                      }}
                    >
                      <RefreshCw className="size-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : null}
              </div>
              {bodyHtml ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                </div>
              ) : null}
            </div>
          )}

          {!videoLayoutMode && bodyHtml && lessonContent.type === "ARTICLE" && (
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>
          )}

          {lessonContent.type === "QUIZ" && (
            <div className="space-y-4">
              {!videoLayoutMode && bodyHtml ? (
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-lg font-medium mb-2">Quiz Content</p>
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                </div>
              ) : null}
              <Button>Start Quiz</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      {lessonContent.resources && lessonContent.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {lessonContent.resources.map((resource, index) => (
                <ResourceItem key={index} resource={resource} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResourceItem({ resource }: { resource: LessonResource }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded bg-primary/10 flex items-center justify-center">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{resource.title}</p>
          <p className="text-xs text-muted-foreground">{resource.type}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          <Download className="size-4 mr-2" />
          Download
        </a>
      </Button>
    </div>
  );
}

export function LessonContentSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}
