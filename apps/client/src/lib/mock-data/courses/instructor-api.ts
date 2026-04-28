// Mock API for Instructor Course Management
// Replaces real API calls with localStorage-based mock data

import type {
  Course,
  Chapter,
  Lesson,
  CreateCourseDto,
  UpdateCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  ContentUploadResponse,
  CoursesResponse,
  CourseContentTree,
} from "@/types/api/lms/courses.type";

// Course with chapters (local type)
type CourseWithChapters = Course & { chapters: Chapter[] };
import {
  getMockCourses,
  addMockCourse,
  updateMockCourse,
  deleteMockCourse,
  getMockCourseById,
  getMockChaptersByCourse,
  addMockChapter,
  updateMockChapter,
  deleteMockChapter,
  getMockLessonsByChapter,
  addMockLesson,
  updateMockLesson,
  deleteMockLesson,
  uploadMockFile,
  getCurrentMockUser,
  initializeMockData,
} from "./storage";

// Simulate network delay
const DELAY = 300;

function delay<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(promise), DELAY));
}

// ==================== COURSES ====================

export async function getInstructorCoursesQueryFn(): Promise<CoursesResponse> {
  initializeMockData();
  const courses = getMockCourses();
  return delay(
    Promise.resolve({
      items: courses,
      total: courses.length,
      page: 1,
      limit: courses.length,
      totalPages: 1,
    })
  );
}

export async function getInstructorCourseByIdQueryFn(courseId: string): Promise<Course> {
  initializeMockData();
  const course = getMockCourseById(courseId);
  if (!course) throw new Error("Course not found");
  return delay(Promise.resolve(course));
}

export async function createCourseMutationFn(data: CreateCourseDto): Promise<Course> {
  initializeMockData();
  const user = getCurrentMockUser();
  const course = addMockCourse({
    ...data,
    difficulty: data.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | undefined,
    status: "DRAFT",
    ownerId: user?._id || "mock_instructor",
    enrollmentCount: 0,
  });
  return delay(Promise.resolve(course));
}

export async function updateCourseMutationFn(
  courseId: string,
  data: UpdateCourseDto
): Promise<Course> {
  const course = updateMockCourse(courseId, {
    ...data,
    difficulty: data.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | undefined,
  });
  if (!course) throw new Error("Course not found");
  return delay(Promise.resolve(course));
}

export async function deleteCourseMutationFn(courseId: string): Promise<void> {
  const success = deleteMockCourse(courseId);
  if (!success) throw new Error("Course not found");
  return delay(Promise.resolve());
}

export async function publishCourseMutationFn(
  courseId: string,
  status: "PUBLISHED" | "ARCHIVED"
): Promise<Course> {
  const course = updateMockCourse(courseId, { status });
  if (!course) throw new Error("Course not found");
  return delay(Promise.resolve(course));
}

// ==================== CHAPTERS ====================

export async function getCourseChaptersQueryFn(courseId: string): Promise<Chapter[]> {
  const chapters = getMockChaptersByCourse(courseId);
  return delay(Promise.resolve(chapters));
}

export async function createChapterMutationFn(
  courseId: string,
  data: CreateChapterDto
): Promise<Chapter> {
  // Auto-assign index if not provided
  const existingChapters = getMockChaptersByCourse(courseId);
  const index = data.index || existingChapters.length + 1;

  const chapter = addMockChapter({
    ...data,
    courseId,
    index,
  });
  return delay(Promise.resolve(chapter));
}

export async function updateChapterMutationFn(
  courseId: string,
  chapterId: string,
  data: UpdateChapterDto
): Promise<Chapter> {
  const chapter = updateMockChapter(chapterId, data);
  if (!chapter) throw new Error("Chapter not found");
  return delay(Promise.resolve(chapter));
}

export async function deleteChapterMutationFn(courseId: string, chapterId: string): Promise<void> {
  const success = deleteMockChapter(chapterId);
  if (!success) throw new Error("Chapter not found");
  return delay(Promise.resolve());
}

export async function reorderChaptersMutationFn(
  courseId: string,
  chapterIds: string[]
): Promise<Chapter[]> {
  chapterIds.forEach((id, index) => {
    updateMockChapter(id, { index: index + 1 });
  });
  return delay(Promise.resolve(getMockChaptersByCourse(courseId)));
}

// ==================== LESSONS ====================

export async function getChapterLessonsQueryFn(courseId: string, chapterId: string): Promise<Lesson[]> {
  const lessons = getMockLessonsByChapter(chapterId);
  return delay(Promise.resolve(lessons));
}

export async function getLessonByIdQueryFn(
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<Lesson> {
  const lessons = getMockLessonsByChapter(chapterId);
  const lesson = lessons.find((l) => l._id === lessonId);
  if (!lesson) throw new Error("Lesson not found");
  return delay(Promise.resolve(lesson));
}

export async function createLessonMutationFn(
  courseId: string,
  chapterId: string,
  data: CreateLessonDto
): Promise<Lesson> {
  // Auto-assign index if not provided
  const existingLessons = getMockLessonsByChapter(chapterId);
  const index = data.index || existingLessons.length + 1;

  const lesson = addMockLesson({
    ...data,
    courseId,
    chapterId,
    index,
  });
  return delay(Promise.resolve(lesson));
}

export async function updateLessonMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: UpdateLessonDto
): Promise<Lesson> {
  const lesson = updateMockLesson(lessonId, data);
  if (!lesson) throw new Error("Lesson not found");
  return delay(Promise.resolve(lesson));
}

export async function deleteLessonMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<void> {
  const success = deleteMockLesson(lessonId);
  if (!success) throw new Error("Lesson not found");
  return delay(Promise.resolve());
}

export async function reorderLessonsMutationFn(
  courseId: string,
  chapterId: string,
  lessonIds: string[]
): Promise<Lesson[]> {
  lessonIds.forEach((id, index) => {
    updateMockLesson(id, { index: index + 1 });
  });
  return delay(Promise.resolve(getMockLessonsByChapter(chapterId)));
}

// ==================== CONTENT UPLOAD ====================

export async function uploadContentFileMutationFn(
  courseId: string,
  contentType: "lesson" | "thumbnail",
  contentId: string,
  file: File
): Promise<ContentUploadResponse> {
  return uploadMockFile(file, courseId, contentId);
}

// ==================== COURSE CONTENT TREE ====================

export async function getCourseContentTreeQueryFn(courseId: string): Promise<CourseContentTree> {
  initializeMockData();
  const course = getMockCourseById(courseId);
  if (!course) throw new Error("Course not found");

  // Get chapters with lessons for building content tree
  const rawChapters = getMockChaptersByCourse(courseId);
  const chaptersWithLessons = rawChapters.map((ch) => ({
    ...ch,
    lessons: getMockLessonsByChapter(ch._id),
  }));

  return delay(
    Promise.resolve({
      courseId,
      chapters: chaptersWithLessons.map((ch: Chapter & { lessons: Lesson[] }) => ({
        _id: ch._id,
        title: ch.title,
        index: ch.index,
        lessons: (ch.lessons || []).map((l: Lesson) => ({
          _id: l._id,
          title: l.title,
          index: l.index,
          duration: l.durationMinutes || 0,
          type: l.type || "VIDEO",
          content: l.content,
        })),
      })),
    })
  );
}

// ==================== COURSE WITH CHAPTERS ====================

export async function getInstructorCourseWithChaptersQueryFn(
  courseId: string
): Promise<CourseWithChapters> {
  initializeMockData();
  const course = getMockCourseById(courseId);
  if (!course) throw new Error("Course not found");

  const chapters = getMockChaptersByCourse(courseId);
  const chaptersWithLessons = chapters.map((ch) => ({
    ...ch,
    lessons: getMockLessonsByChapter(ch._id),
  }));

  return delay(
    Promise.resolve({
      ...course,
      chapters: chaptersWithLessons,
    } as CourseWithChapters)
  );
}
