import API from "@/services/axios-client";
import {
  Course,
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
  CoursesResponse,
  CourseAggregatesResponse,
  Chapter,
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
  ChaptersResponse,
  Lesson,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
  VideoUploadUrlDto,
  VideoUploadResponse,
  FileUploadResponse,
} from "@/types/api/lms/courses.type";

// Create new course
export const createCourseMutationFn = async (
  data: CreateCourseDto
): Promise<Course> => {
  const response = await API.post("/api/v1/lms/courses/createCourse", data);
  return response.data;
};

// Update course
export const updateCourseMutationFn = async (
  courseId: string,
  data: UpdateCourseDto
): Promise<Course> => {
  const response = await API.patch(`/api/v1/lms/courses/${courseId}`, data);
  return response.data;
};

// Publish/Unpublish course
export const publishCourseMutationFn = async (
  courseId: string,
  data: PublishCourseDto
): Promise<Course> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/publish`,
    data
  );
  return response.data;
};

// Delete course
export const deleteCourseMutationFn = async (
  courseId: string
): Promise<{ message: string }> => {
  const response = await API.delete(`/api/v1/lms/courses/${courseId}`);
  return response.data;
};

// Recompute course aggregates
export const recomputeCourseAggregatesMutationFn = async (
  courseId: string
): Promise<CourseAggregatesResponse> => {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/recompute-aggregates`
  );
  return response.data;
};

// Get all courses (for instructor - includes draft courses)
export const getInstructorCoursesQueryFn = async (
  params?: {
    category?: string;
    difficulty?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<CoursesResponse> => {
  const response = await API.get("/api/v1/lms/courses", { params });
  return response.data;
};

// Get course by ID
export const getInstructorCourseByIdQueryFn = async (
  courseId: string
): Promise<Course> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}`);
  return response.data;
};

// ============== Chapter API Functions ==============

// Create new chapter
export const createChapterMutationFn = async (
  courseId: string,
  data: CreateChapterDto
): Promise<Chapter> => {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters`,
    data
  );
  return response.data;
};

// Update chapter
export const updateChapterMutationFn = async (
  courseId: string,
  chapterId: string,
  data: UpdateChapterDto
): Promise<Chapter> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}`,
    data
  );
  return response.data;
};

// Delete chapter
export const deleteChapterMutationFn = async (
  courseId: string,
  chapterId: string
): Promise<{ message: string }> => {
  const response = await API.delete(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}`
  );
  return response.data;
};

// Reorder chapters
export const reorderChaptersMutationFn = async (
  courseId: string,
  data: ReorderChaptersDto
): Promise<Chapter> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/reorder`,
    data
  );
  return response.data;
};

// Get all chapters for a course
export const getChaptersQueryFn = async (
  courseId: string,
  params?: {
    page?: number;
    limit?: number;
  }
): Promise<ChaptersResponse> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/chapters`,
    { params }
  );
  return response.data;
};

// Get chapter by ID
export const getChapterByIdQueryFn = async (
  courseId: string,
  chapterId: string
): Promise<Chapter> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}`
  );
  return response.data;
};

// ============== Lesson API Functions ==============

// Create new lesson
export const createLessonMutationFn = async (
  courseId: string,
  chapterId: string,
  data: CreateLessonDto
): Promise<Lesson> => {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons`,
    data
  );
  return response.data;
};

// Update lesson
export const updateLessonMutationFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: UpdateLessonDto
): Promise<Lesson> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
    data
  );
  return response.data;
};

// Delete lesson
export const deleteLessonMutationFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<{ message: string }> => {
  const response = await API.delete(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`
  );
  return response.data;
};

// Reorder lessons
export const reorderLessonsMutationFn = async (
  courseId: string,
  chapterId: string,
  data: ReorderLessonsDto
): Promise<{ message: string }> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/reorder`,
    data
  );
  return response.data;
};

// Get lesson by ID
export const getLessonByIdQueryFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<Lesson> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`
  );
  return response.data;
};

// Get presigned URL for video access
export const getVideoUrlMutationFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: VideoUploadUrlDto
): Promise<{ videoUrl: string }> => {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/video/url`,
    data
  );
  return response.data;
};

// Upload video directly to S3
export const uploadVideoMutationFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  file: File
): Promise<VideoUploadResponse> => {
  const formData = new FormData();
  formData.append("video", file);

  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/video/upload-direct`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Upload file to lesson
export const uploadFileMutationFn = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
  file: File
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
