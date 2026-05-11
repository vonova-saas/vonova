/**
 * Course progress view model (student × course).
 *
 * Persisted today as:
 * - one `LessonProgress` document per (userId, courseId, lessonId)
 * - `Enrollment.progressPercentage`, `lastLessonId`, `lastAccessedAt`
 *
 * There is no separate `course_progress` Mongo collection; this file defines
 * the public API contract only.
 */
export interface CourseProgressView {
  studentId: string;
  courseId: string;
  completedLessons: string[];
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessons: number;
  completed: boolean;
  lastLessonId?: string | null;
  lastAccessedAt?: string | null;
}
