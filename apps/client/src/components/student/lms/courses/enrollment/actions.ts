"use server";

import { ApiResponse } from "@/lib/courses/types";

export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse> {
  // Demo-only: no auth, no DB, no payments.
  // Simulate a successful enrollment for the given courseId.
  console.log("Demo enrollInCourseAction called", { courseId });

  return {
    status: "success",
    message: "You have been enrolled in this course (demo mode).",
  };
}
