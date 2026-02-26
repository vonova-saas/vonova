'use server'

import { ApiResponse } from "@/lib/courses/types"
import { lessonSchema, LessonSchemaType } from "@/lib/courses/zodSchema"


export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  const result = lessonSchema.safeParse(values);

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid data",
    };
  }

  console.log("Demo updateLesson called", { lessonId, values: result.data });

  return {
    status: "success",
    message: "Lesson updated successfully (demo mode)",
  };
}
