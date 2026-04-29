"use server";

import { ApiResponse } from "@/lib/courses/types";
import { markLessonCompleteMutationFn } from "@/services/student/lms/courses/courses.api";

export async function markLessonComlete(
  lessonId: string,
  courseId: string
): Promise<ApiResponse> {
  try {
    const data: MarkLessonCompleteDto = {
      completed: true,
      timeSpentSec,
    };

    // await markLessonCompleteMutationFn(courseId, lessonId, data);
    await markLessonCompleteMutationFn(courseId, lessonId);

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
