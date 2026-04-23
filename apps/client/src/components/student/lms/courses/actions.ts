"use server";

import { ApiResponse } from "@/lib/courses/types";
import { markLessonCompleteMutationFn } from "@/services/student/lms/courses/courses.api";
import { MarkLessonCompleteDto } from "@/types/api/lms/courses.type";

export async function markLessonComlete(
  lessonId: string,
  courseId: string,
  timeSpentSec?: number
): Promise<ApiResponse> {
  try {
    const data: MarkLessonCompleteDto = {
      completed: true,
      timeSpentSec,
    };

    await markLessonCompleteMutationFn(courseId, lessonId, data);

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
