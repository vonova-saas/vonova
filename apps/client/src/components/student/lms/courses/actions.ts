"use server";

import { ApiResponse } from "@/lib/courses/types";
import { markLessonCompleteMutationFn } from "@/services/student/lms/courses/courses.api";

/** @deprecated Typo — use `markLessonComplete` */
export async function markLessonComlete(
  lessonId: string,
  courseId: string,
): Promise<ApiResponse> {
  return markLessonComplete(lessonId, courseId);
}

export async function markLessonComplete(
  lessonId: string,
  courseId: string,
): Promise<ApiResponse> {
  try {
    await markLessonCompleteMutationFn(courseId, lessonId, {
      completed: true,
    });

    return {
      status: "success",
      message: "Lesson marked as complete",
    };
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return {
      status: "error",
      message: "Failed to mark lesson as complete. Please try again.",
    };
  }
}
