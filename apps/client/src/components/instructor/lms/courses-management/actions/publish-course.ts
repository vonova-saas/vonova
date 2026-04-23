"use server";

import { ApiResponse } from "@/lib/courses/types";
import { publishCourseMutationFn } from "@/services/instructor/course-managment/courses.api";
import { PublishCourseDto } from "@/types/api/lms/courses.type";

export async function publishCourseAction(
  courseId: string,
  status: "PUBLISHED" | "ARCHIVED"
): Promise<ApiResponse> {
  try {
    const data: PublishCourseDto = { status };
    await publishCourseMutationFn(courseId, data);
    return {
      status: "success",
      message: status === "PUBLISHED" ? "Course published successfully" : "Course archived successfully",
    };
  } catch (error) {
    console.error("Error publishing course:", error);
    return {
      status: "error",
      message: "Failed to update course status. Please try again.",
    };
  }
}
