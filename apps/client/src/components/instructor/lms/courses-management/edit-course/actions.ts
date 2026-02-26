"use server";

import { ApiResponse } from "@/lib/courses/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
  LessonSchemaType,
} from "@/lib/courses/zodSchema";

export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const result = courseSchema.safeParse(data);

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid data",
    };
  }

  console.log("Demo editCourse called", { courseId, values: result.data });

  return {
    status: "success",
    message: "Course updated successfully (demo mode)",
  };
}

export async function reorderLessons(
  chapterId: string,
  lessons: {
    id: string;
    position: number;
  }[],
  courseId: string
): Promise<ApiResponse> {
  if (!lessons || lessons.length === 0) {
    return {
      status: "error",
      message: "No lessons provided for reordering.",
    };
  }

  console.log("Demo reorderLessons called", { chapterId, courseId, lessons });

  return {
    status: "success",
    message: "Lessons reordered successfully (demo mode).",
  };
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  if (!chapters || chapters.length === 0) {
    return {
      status: "error",
      message: "No chapters provided for reordering.",
    };
  }

  console.log("Demo reorderChapters called", { courseId, chapters });

  return {
    status: "success",
    message: "Chapters reordered successfully (demo mode).",
  };
}

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  const result = chapterSchema.safeParse(values);

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid Data",
    };
  }

  console.log("Demo createChapter called", { values: result.data });

  return {
    status: "success",
    message: "Chapter created successfully (demo mode)",
  };
}

export async function createLesson(
  values: LessonSchemaType
): Promise<ApiResponse> {
  const result = lessonSchema.safeParse(values);

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid Data",
    };
  }

  console.log("Demo createLesson called", { values: result.data });

  return {
    status: "success",
    message: "Lesson created successfully (demo mode)",
  };
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  console.log("Demo deleteLesson called", { chapterId, courseId, lessonId });

  return {
    status: "success",
    message: "Lesson deleted successfully (demo mode)",
  };
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  console.log("Demo deleteChapter called", { chapterId, courseId });

  return {
    status: "success",
    message: "Chapter deleted successfully (demo mode)",
  };
}
