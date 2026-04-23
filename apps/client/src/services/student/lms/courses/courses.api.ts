import API from "@/services/axios-client";
import {
  Course,
  CoursesResponse,
  Enrollment,
  EnrollCourseDto,
  LessonAccess,
  CourseContentTree,
  LessonContent,
  ContentUploadResponse,
  LessonProgress,
  MarkLessonCompleteDto,
  CourseProgress,
  CourseReview,
  CreateReviewDto,
  ReviewsResponse,
} from "@/types/api/lms/courses.type";

// Get all courses with optional filtering
export const getAllCoursesQueryFn = async (
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

// Get course by slug
export const getCourseBySlugQueryFn = async (
  slug: string
): Promise<Course> => {
  const response = await API.get(`/api/v1/lms/courses/slug/${slug}`);
  return response.data;
};

// Get course by ID
export const getCourseByIdQueryFn = async (
  courseId: string
): Promise<Course> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}`);
  return response.data;
};

// ============== Enrollment API Functions ==============

// Enroll in a course
export const enrollCourseMutationFn = async (
  courseId: string,
  data?: EnrollCourseDto
): Promise<Enrollment> => {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/enroll`,
    data || {}
  );
  return response.data;
};

// Get enrollment status for a course
export const getEnrollmentStatusQueryFn = async (
  courseId: string
): Promise<Enrollment> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/enrollment`);
  return response.data;
};

// Get lesson access status
export const getLessonAccessQueryFn = async (
  courseId: string,
  lessonId: string
): Promise<LessonAccess> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/access`
  );
  return response.data;
};

// ============== Content API Functions ==============

// Get course content tree (chapters and lessons)
export const getCourseContentTreeQueryFn = async (
  courseId: string
): Promise<CourseContentTree> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/content`);
  return response.data;
};

// Get lesson content
export const getLessonContentQueryFn = async (
  courseId: string,
  lessonId: string
): Promise<LessonContent> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/content/lessons/${lessonId}/content`
  );
  return response.data;
};

// Upload file to course content
export const uploadContentFileMutationFn = async (
  courseId: string,
  file: File,
  contentType: "lesson" | "chapter" | "course",
  contentId: string
): Promise<ContentUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/content/upload`,
    formData,
    {
      params: {
        contentType,
        contentId,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// ============== Progress API Functions ==============

// Mark lesson as complete
export const markLessonCompleteMutationFn = async (
  courseId: string,
  lessonId: string,
  data: MarkLessonCompleteDto
): Promise<LessonProgress> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/complete`,
    data
  );
  return response.data;
};

// Get course progress
export const getCourseProgressQueryFn = async (
  courseId: string
): Promise<CourseProgress> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/progress/me`);
  return response.data;
};

// ============== Review API Functions ==============

// Create course review
export const createReviewMutationFn = async (
  courseId: string,
  data: CreateReviewDto
): Promise<CourseReview> => {
  const response = await API.post(`/api/v1/lms/courses/${courseId}/reviews`, data);
  return response.data;
};

// Get course reviews
export const getCourseReviewsQueryFn = async (
  courseId: string,
  params?: {
    page?: number;
    limit?: number;
  }
): Promise<ReviewsResponse> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/reviews`, {
    params,
  });
  return response.data;
};

// Get user's own review for a course
export const getMyReviewQueryFn = async (
  courseId: string
): Promise<CourseReview> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/reviews/my`);
  return response.data;
};
