import type { QueryClient } from "@tanstack/react-query";
import { coursesKeys } from "@/hooks/student/lms/use-courses";
import { instructorLessonEditorLibraryQueryKey } from "@/services/api/shared/material-library/material.api";

export type InvalidateLmsMediaOptions = {
  chapterId?: string;
  lessonId?: string;
};

/**
 * Broad invalidation after course / lesson / content-tree changes so instructor
 * and student views refetch instead of stale React Query caches.
 */
export function invalidateLmsMediaForCourse(
  qc: QueryClient,
  courseId: string,
  opts?: InvalidateLmsMediaOptions,
): void {
  void qc.invalidateQueries({ queryKey: coursesKeys.all });
  void qc.invalidateQueries({ queryKey: coursesKeys.contentTree(courseId) });
  void qc.invalidateQueries({ queryKey: coursesKeys.detailById(courseId) });
  void qc.invalidateQueries({ queryKey: ["instructor-course", courseId] });
  void qc.invalidateQueries({ queryKey: ["instructor-courses"] });
  void qc.invalidateQueries({ queryKey: ["course-details", courseId] });
  void qc.invalidateQueries({ queryKey: ["course-details"] });
  void qc.invalidateQueries({ queryKey: ["courses"] });
  void qc.invalidateQueries({ queryKey: ["my-courses"] });

  void qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "courses" &&
      q.queryKey.includes(courseId),
  });

  if (opts?.chapterId && opts?.lessonId) {
    void qc.invalidateQueries({
      queryKey: ["lesson", courseId, opts.chapterId, opts.lessonId],
    });
    void qc.invalidateQueries({
      queryKey: coursesKeys.lessonContent(courseId, opts.lessonId),
    });
    void qc.invalidateQueries({
      queryKey: coursesKeys.lessonAccess(courseId, opts.lessonId),
    });
  }
}

export function invalidateMaterialLibraryQueries(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: ["materials"] });
  void qc.invalidateQueries({ queryKey: [...instructorLessonEditorLibraryQueryKey] });
  void qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "lms" &&
      q.queryKey[1] === "material-signed-view",
  });
}

export async function scheduleInvalidateLmsMediaForCourse(
  courseId: string,
  opts?: InvalidateLmsMediaOptions,
): Promise<void> {
  if (typeof window === "undefined") return;
  const { queryClient } = await import("@/providers/providers");
  invalidateLmsMediaForCourse(queryClient, courseId, opts);
}

export async function scheduleInvalidateMaterialLibraryQueries(): Promise<void> {
  if (typeof window === "undefined") return;
  const { queryClient } = await import("@/providers/providers");
  invalidateMaterialLibraryQueries(queryClient);
}
