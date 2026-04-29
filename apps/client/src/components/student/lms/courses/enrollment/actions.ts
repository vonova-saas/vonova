"use server";

import { ApiResponse } from "@/lib/courses/types";
import { enrollCourseMutationFn } from "@/services/student/lms/courses/courses.api";

export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse> {
  try {
    const data: EnrollCourseDto = couponCode ? { couponCode } : {};
    // await enrollCourseMutationFn(courseId, data);
    await enrollCourseMutationFn(courseId);

    return {
      status: "success",
      message: "You have been enrolled in this course successfully.",
    };
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return {
      status: "error",
      message: "Failed to enroll in course. Please try again.",
    };
  }
}
