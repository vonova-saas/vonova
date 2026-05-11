"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentCourseProgress } from "@/types/api/lms/courses.type";
import { getCourseProgressQueryFn } from "@/services/student/lms/courses/courses.api";
import { Clock } from "lucide-react";

interface iAppProps {
  courseId: string;
}

export function CourseProgressViewer({ courseId }: iAppProps) {
  const [progress, setProgress] = useState<StudentCourseProgress | null>(null);
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

    void fetchProgress();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Completion</span>
              <span className="text-muted-foreground">
                {progress.completedLessonsCount} / {progress.totalLessons} lessons
              </span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.progressPercentage}% complete</span>
              {progress.lastAccessedAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Last activity{" "}
                  {new Date(progress.lastAccessedAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
    </div>
  );
}
