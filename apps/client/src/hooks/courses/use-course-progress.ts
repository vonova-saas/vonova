"use client";

import { CourseSidebarDataType } from "@/components/student/lms/courses/data/get-course-sidebar-data";
import { useMemo } from "react";

export interface ContentTreeProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

/**
 * Fallback when LMS progress API is unavailable: derive counts from embedded
 * `lessonProgress` on the sidebar tree (often empty — prefer React Query + GET /progress).
 */
export function deriveProgressFromContentTree(
  courseData: CourseSidebarDataType["course"],
): ContentTreeProgressSummary {
  let totalLessons = 0;
  let completedLessons = 0;

  (courseData?.chapter || []).forEach((chapter: { lessons?: unknown[] }) => {
    (chapter?.lessons || []).forEach((lesson: unknown) => {
      const le = lesson as { id?: string; lessonProgress?: { lessonId?: string; completed?: boolean }[] };
      totalLessons += 1;
      const isCompleted = (le?.lessonProgress || []).some(
        (progress) =>
          progress.lessonId === le?.id && progress.completed === true,
      );
      if (isCompleted) completedLessons += 1;
    });
  });

  const progressPercentage =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  return {
    totalLessons,
    completedLessons,
    progressPercentage,
  };
}
