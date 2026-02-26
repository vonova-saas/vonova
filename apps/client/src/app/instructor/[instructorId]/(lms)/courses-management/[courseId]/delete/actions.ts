"use server";

import { ApiResponse } from "@/lib/courses/types";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  return {
    status: "success",
    message: "Course deleted successfully (demo mode) with id: " + courseId,
  };
}
