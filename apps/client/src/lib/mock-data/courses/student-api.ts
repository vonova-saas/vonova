/* eslint-disable @typescript-eslint/no-unused-vars */
// Mock API for Student Courses
// Replaces real API calls with localStorage-based mock data

import type {
  Course,
  Enrollment,
  CoursesResponse,
  CourseContentTree,
  LessonAccess,
  LessonContent,
  ContentUploadResponse,
  CourseProgress,
  LessonProgress,
} from "@/types/api/lms/courses.type";
import {
  getMockCourses,
  getMockCourseById,
  getMockChaptersByCourse,
  getMockLessonsByChapter,
  addMockEnrollment,
  getMockEnrollment,
  isUserEnrolled,
  getCurrentMockUser,
  initializeMockData,
  uploadMockFile,
  getMockUpload,
} from "./storage";

// Simulate network delay
const DELAY = 300;

function delay<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(promise), DELAY));
}

// ==================== BROWSE COURSES ====================

export async function getAllCoursesQueryFn(params?: {
  category?: string;
  difficulty?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<CoursesResponse> {
  initializeMockData();
  let courses = getMockCourses();

  // Filter by status (default to PUBLISHED)
  if (params?.status) {
    courses = courses.filter((c) => c.status === params.status);
  } else {
    courses = courses.filter((c) => c.status === "PUBLISHED");
  }

  // Filter by difficulty
  if (params?.difficulty) {
    courses = courses.filter((c) => c.difficulty === params.difficulty);
  }

  // Filter by category/tags
  if (params?.category) {
    courses = courses.filter(
      (c) => c.tags?.some((tag) => tag.toLowerCase().includes(params.category!.toLowerCase()))
    );
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedCourses = courses.slice(start, end);

  return delay(
    Promise.resolve({
      items: paginatedCourses,
      total: courses.length,
      page,
      limit,
      totalPages: Math.ceil(courses.length / limit),
    })
  );
}

export async function getCourseByIdQueryFn(courseId: string): Promise<Course> {
  initializeMockData();
  const course = getMockCourseById(courseId);
  if (!course) throw new Error("Course not found");
  return delay(Promise.resolve(course));
}

export async function getCourseBySlugQueryFn(slug: string): Promise<Course> {
  initializeMockData();
  const courses = getMockCourses();
  const course = courses.find((c) => c.slug === slug);
  if (!course) throw new Error("Course not found");

  // Resolve thumbnail URL if it's an upload key
  let thumbnailUrl = course.thumbnailUrl;
  if (thumbnailUrl && !thumbnailUrl.startsWith("http") && !thumbnailUrl.startsWith("/")) {
    // It's an upload key, try to get the actual URL
    const upload = await getMockUpload(thumbnailUrl);
    if (upload?.url) {
      thumbnailUrl = upload.url;
    }
  }

  return delay(Promise.resolve({
    ...course,
    thumbnailUrl: thumbnailUrl || undefined,
  }));
}

// ==================== ENROLLMENT ====================

export async function enrollCourseMutationFn(
  courseId: string
): Promise<Enrollment> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) throw new Error("User not authenticated");

  const enrollment = addMockEnrollment(courseId, user._id);
  return delay(Promise.resolve(enrollment));
}

export async function getEnrollmentStatusQueryFn(courseId: string): Promise<Enrollment> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) throw new Error("User not authenticated");

  const enrollment = getMockEnrollment(courseId, user._id);
  if (!enrollment) throw new Error("Not enrolled");
  return delay(Promise.resolve(enrollment));
}

export async function getStudentEnrollmentsQueryFn(): Promise<Enrollment[]> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) return delay(Promise.resolve([]));

  // This would filter by userId in a real implementation
  // For mock, we return all enrollments
  const { getMockEnrollments } = await import("./storage");
  return delay(Promise.resolve(getMockEnrollments()));
}

// ==================== COURSE CONTENT ====================

export async function getCourseContentTreeQueryFn(courseId: string): Promise<CourseContentTree> {
  initializeMockData();
  const course = getMockCourseById(courseId);
  if (!course) throw new Error("Course not found");

  const chapters = getMockChaptersByCourse(courseId).map((ch) => ({
    ...ch,
    lessons: getMockLessonsByChapter(ch._id),
  }));

  return delay(
    Promise.resolve({
      courseId,
      chapters: chapters.map((ch) => ({
        _id: ch._id,
        title: ch.title,
        index: ch.index,
        lessons: (ch.lessons || []).map((l) => ({
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

export async function getLessonAccessQueryFn(
  courseId: string,
  lessonId: string
): Promise<LessonAccess> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) throw new Error("User not authenticated");

  const allLessons = getMockLessonsByChapter("");
  const lesson = allLessons.find((l) => l._id === lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const hasAccess = lesson.previewable || isUserEnrolled(courseId, user._id);

  return delay(
    Promise.resolve({
      hasAccess,
      isPreviewable: lesson.previewable || false,
      isEnrolled: isUserEnrolled(courseId, user._id),
      enrollmentStatus: isUserEnrolled(courseId, user._id) ? "ACTIVE" : "INACTIVE",
      lessonCompleted: false,
      nextLessonAvailable: false,
    })
  );
}

export async function getLessonContentQueryFn(
  courseId: string,
  lessonId: string
): Promise<LessonContent> {
  initializeMockData();
  const allLessons = getMockLessonsByChapter("");
  const lesson = allLessons.find((l) => l._id === lessonId);
  if (!lesson) throw new Error("Lesson not found");

  return delay(
    Promise.resolve({
      _id: lesson._id,
      title: lesson.title,
      content: lesson.content || "",
      type: lesson.type || "VIDEO",
      durationMinutes: lesson.durationMinutes || 0,
      resources: [],
      isCompleted: false,
      progress: 0,
      videoKey: lesson.videoKey,
      thumbnailKey: lesson.thumbnailKey,
    })
  );
}

// ==================== PROGRESS ====================

export async function getCourseProgressQueryFn(courseId: string): Promise<CourseProgress> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) throw new Error("User not authenticated");

  const enrollment = getMockEnrollment(courseId, user._id);
  const allLessons = getMockLessonsByChapter("").filter((l) => l.courseId === courseId);

  return delay(
    Promise.resolve({
      courseId,
      userId: user._id,
      overallProgress: enrollment?.progress || 0,
      completedLessons: enrollment?.completedLessons || 0,
      totalLessons: allLessons.length,
      totalTimeSpent: 0,
      lastAccessedAt: enrollment?.enrolledAt || new Date().toISOString(),
      chapters: [],
    })
  );
}

export async function markLessonCompleteMutationFn(
  courseId: string,
  lessonId: string
): Promise<LessonProgress> {
  initializeMockData();
  const user = getCurrentMockUser();
  if (!user) throw new Error("User not authenticated");

  const enrollment = getMockEnrollment(courseId, user._id);
  if (!enrollment) throw new Error("Not enrolled");

  // Update progress
  const completed = (enrollment.completedLessons || 0) + 1;
  const total = enrollment.totalLessons || 1;
  const progress = Math.round((completed / total) * 100);

  const { updateMockEnrollment } = await import("./storage");
  updateMockEnrollment(enrollment._id, {
    completedLessons: completed,
    progress,
  });

  return delay(
    Promise.resolve({
      _id: `${courseId}_${lessonId}`,
      userId: user._id,
      courseId,
      lessonId,
      completed: true,
      timeSpentSec: 0,
      completedAt: new Date().toISOString(),
    })
  );
}

// ==================== UPLOADS ====================

// Primary upload function (called from components)
export async function uploadContentFileMutationFn(
  courseId: string,
  file: File,
  contentType: "lesson" | "chapter" | "course",
  contentId: string
): Promise<ContentUploadResponse> {
  return uploadMockFile(file, courseId, contentId);
}

// Alternative upload function with metadata
export async function uploadContentFileWithMetadataMutationFn(
  file: File,
  metadata?: { courseId?: string; lessonId?: string }
): Promise<ContentUploadResponse> {
  return uploadMockFile(file, metadata?.courseId || "", metadata?.lessonId || "");
}

// Helper to update enrollment (internal use)
import { updateMockEnrollment as storageUpdateMockEnrollment } from "./storage";
async function updateMockEnrollment(
  enrollmentId: string,
  updates: Partial<Enrollment>
): Promise<void> {
  storageUpdateMockEnrollment(enrollmentId, updates);
}
