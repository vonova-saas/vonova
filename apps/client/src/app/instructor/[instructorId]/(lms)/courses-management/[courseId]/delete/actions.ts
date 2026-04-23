"use server";

import { ApiResponse } from "@/lib/courses/types";
import { deleteCourseMutationFn } from "@/services/instructor/course-managment/courses.api";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  try {
    await deleteCourseMutationFn(courseId);
    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting course:", error);
    return {
      status: "error",
      message: "Failed to delete course. Please try again.",
    };
  }
}
