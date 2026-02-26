"use server";

import { ApiResponse } from "@/lib/courses/types";
import { courseSchema, CourseSchemaType } from "@/lib/courses/zodSchema";

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  // Demo-only: validate values locally and return a fake success response
  const validation = courseSchema.safeParse(values);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  return {
    status: "success",
    message: "Course created successfully (demo mode)",
  };
}
