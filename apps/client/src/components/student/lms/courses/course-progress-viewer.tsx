"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseProgress } from "@/types/api/lms/courses.type";
import { getCourseProgressQueryFn } from "@/services/student/lms/courses/courses.api";
import { CheckCircle, Clock, Play, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface iAppProps {
  courseId: string;
}

export function CourseProgressViewer({ courseId }: iAppProps) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true);
        const progressData = await getCourseProgressQueryFn(courseId);
        setProgress(progressData);
        setError(null);
      } catch (err) {
        console.error("Error fetching course progress:", err);
        setError("Failed to load progress");
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [courseId]);

  if (loading) {
    return <CourseProgressSkeleton />;
  }

  if (error || !progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">{error || "Progress not available"}</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round(progress.overallProgress * 100);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Completion</span>
              <span className="text-muted-foreground">
                {progress.completedLessons} / {progress.totalLessons} lessons
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressPercentage}% complete</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(progress.totalTimeSpent)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Lesson */}
      {progress.nextLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="size-5" />
              Next Lesson
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{progress.nextLesson.title}</p>
              <p className="text-sm text-muted-foreground">
                in {progress.nextLesson.chapterTitle}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="size-5" />
            Chapter Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.chapters.map((chapter) => {
              const chapterProgressPercentage = Math.round(chapter.progress * 100);
              const isComplete = chapter.progress === 1;

              return (
                <div key={chapter.chapterId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <CheckCircle className="size-4 text-green-600" />
                      )}
                      <span className={cn("font-medium", isComplete && "text-green-700")}>
                        {chapter.title}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {chapter.completedLessons} / {chapter.totalLessons}
                    </span>
                  </div>
                  <Progress
                    value={chapterProgressPercentage}
                    className={cn(
                      "h-2",
                      isComplete && "[&>div]:bg-green-600"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function CourseProgressSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
