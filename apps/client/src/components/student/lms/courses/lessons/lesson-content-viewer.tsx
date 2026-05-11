"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonContent, LessonResource } from "@/types/api/lms/courses.type";
import { getLessonContentQueryFn } from "@/services/student/lms/courses/courses.api";
import { FileText, Download, Clock, RefreshCw } from "lucide-react";

interface iAppProps {
  courseId: string;
  lessonId: string;
}

export function LessonContentViewer({ courseId, lessonId }: iAppProps) {
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchLessonContent() {
      try {
        setLoading(true);
        const body = await getLessonContentQueryFn(courseId, lessonId);
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
        setLessonContent({
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
          videoPosterUrl: l.video?.thumbnailUrl ?? l.video?.posterUrl,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching lesson content:", err);
        setError("Failed to load lesson content");
      } finally {
        setLoading(false);
      }
    }

    fetchLessonContent();
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
  const streamUrl = (lessonContent.videoStreamUrl ?? "").trim();
  const videoLayoutMode = !!(streamUrl || lessonContent.videoObjectKey?.trim());
  const bodyHtml = lessonContent.content?.trim();

  if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    streamUrl
  ) {
    console.log("STREAM URL:", streamUrl);
  }

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
                {streamUrl ? (
                  <video
                    key={streamUrl}
                    src={streamUrl}
                    controls
                    preload="metadata"
                    playsInline
                    className="block h-full w-full min-h-48 object-contain bg-black"
                  />
                ) : lessonContent.videoObjectKey?.trim() ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Video temporarily unavailable
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Playback could not be started. This is usually temporary.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setRetryCount((n) => n + 1)}
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
