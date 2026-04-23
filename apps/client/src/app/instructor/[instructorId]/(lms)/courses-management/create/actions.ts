"use server";

import { ApiResponse } from "@/lib/courses/types";
import { courseSchema, CourseSchemaType } from "@/lib/courses/zodSchema";
import { createCourseMutationFn } from "@/services/instructor/course-managment/courses.api";
import { CreateCourseDto } from "@/types/api/lms/courses.type";

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const validation = courseSchema.safeParse(values);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  try {
    const courseData: CreateCourseDto = {
      title: values.title,
      slug: values.slug,
      smallDescription: values.smallDescription,
      description: values.description,
      difficulty: values.level === "Intermidate" ? "Intermediate" : values.level,
      tags: [],
      thumbnailUrl: values.fileKey || "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      language: "English",
      price: {
        amount: Number(values.price),
        currency: "USD",
        isFree: Number(values.price) === 0,
      },
    };

    await createCourseMutationFn(courseData);

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (error) {
    console.error("Error creating course:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create course. Please try again.",
    };
  }
}
