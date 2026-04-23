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
import { updateCourseMutationFn, createChapterMutationFn, deleteChapterMutationFn, reorderChaptersMutationFn, createLessonMutationFn, deleteLessonMutationFn, reorderLessonsMutationFn } from "@/services/instructor/course-managment/courses.api";
import { UpdateCourseDto, CreateChapterDto, ReorderChaptersDto, CreateLessonDto, ReorderLessonsDto } from "@/types/api/lms/courses.type";

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

  try {
    const updateData: UpdateCourseDto = {
      title: data.title,
      slug: data.slug,
      smallDescription: data.smallDescription,
      description: data.description,
      difficulty: data.level === "Intermidate" ? "Intermediate" : data.level === "Beginner" ? "Beginner" : "Advanced",
      tags: [],
      thumbnailUrl: data.fileKey || undefined,
      language: "English",
      price: {
        amount: data.price,
        currency: "USD",
        isFree: data.price === 0,
      },
      status: data.status === "Draft" ? "DRAFT" : data.status === "Published" ? "PUBLISHED" : "ARCHIVED",
    };

    await updateCourseMutationFn(courseId, updateData);

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    console.error("Error updating course:", error);
    return {
      status: "error",
      message: "Failed to update course. Please try again.",
    };
  }
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

  try {
    const reorderData: ReorderLessonsDto = {
      order: lessons.map(lesson => ({
        lessonId: lesson.id,
        index: lesson.position,
      })),
    };

    await reorderLessonsMutationFn(courseId, chapterId, reorderData);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch (error) {
    console.error("Error reordering lessons:", error);
    return {
      status: "error",
      message: "Failed to reorder lessons. Please try again.",
    };
  }
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

  try {
    const reorderData: ReorderChaptersDto = {
      order: chapters.map(ch => ({
        chapterId: ch.id,
        index: ch.position,
      })),
    };

    await reorderChaptersMutationFn(courseId, reorderData);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch (error) {
    console.error("Error reordering chapters:", error);
    return {
      status: "error",
      message: "Failed to reorder chapters. Please try again.",
    };
  }
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

  try {
    const chapterData: CreateChapterDto = {
      title: values.name,
      index: 1, // Will be auto-calculated by backend
    };

    await createChapterMutationFn(values.courseId, chapterData);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch (error) {
    console.error("Error creating chapter:", error);
    return {
      status: "error",
      message: "Failed to create chapter. Please try again.",
    };
  }
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

  try {
    const lessonData: CreateLessonDto = {
      title: values.name,
      index: 1, // Will be auto-calculated by backend
      type: "VIDEO", // Default type
      previewable: false,
    };

    await createLessonMutationFn(values.courseId, values.chapterId, lessonData);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return {
      status: "error",
      message: "Failed to create lesson. Please try again.",
    };
  }
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
  try {
    await deleteLessonMutationFn(courseId, chapterId, lessonId);

    return {
      status: "success",
      message: "Lesson deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return {
      status: "error",
      message: "Failed to delete lesson. Please try again.",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  try {
    await deleteChapterMutationFn(courseId, chapterId);

    return {
      status: "success",
      message: "Chapter deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return {
      status: "error",
      message: "Failed to delete chapter. Please try again.",
    };
  }
}
