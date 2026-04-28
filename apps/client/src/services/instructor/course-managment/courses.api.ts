// Mock API exports - using fake data stored in localStorage
// All functions are re-exported from the mock data layer

export {
  // Courses
  getInstructorCoursesQueryFn,
  getInstructorCourseByIdQueryFn,
  createCourseMutationFn,
  updateCourseMutationFn,
  deleteCourseMutationFn,
  publishCourseMutationFn,
  // Chapters
  getCourseChaptersQueryFn as getChaptersQueryFn,
  // getChapterByIdQueryFn,
  createChapterMutationFn,
  updateChapterMutationFn,
  deleteChapterMutationFn,
  reorderChaptersMutationFn,
  // Lessons
  getChapterLessonsQueryFn,
  getLessonByIdQueryFn,
  createLessonMutationFn,
  updateLessonMutationFn,
  deleteLessonMutationFn,
  reorderLessonsMutationFn,
  // Content
  getCourseContentTreeQueryFn,
  uploadContentFileMutationFn as uploadFileMutationFn,
} from "@/lib/mock-data/courses/instructor-api";

// Placeholder exports for functions not yet implemented in mock
export const recomputeCourseAggregatesMutationFn = async () => ({
  message: "Aggregates updated",
  enrollmentCount: 0,
  averageRating: 0,
});

export const getVideoUrlMutationFn = async (): Promise<{ videoUrl: string }> => ({
  videoUrl: "",
});

export const uploadVideoMutationFn = async (): Promise<{
  message: string;
  videoKey: string;
}> => ({
  message: "Video uploaded",
  videoKey: "",
});

// Types
export type {
  ChaptersResponse,
  VideoUploadUrlDto,
  VideoUploadResponse,
  FileUploadResponse,
} from "@/types/api/lms/courses.type";
