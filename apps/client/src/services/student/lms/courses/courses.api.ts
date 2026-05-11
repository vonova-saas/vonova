// Real API exports - connecting to backend API Gateway
// All functions are re-exported from the real API layer

export {
  // Browse Courses
  getAllCoursesQueryFn,
  getCourseBySlugQueryFn,
  getCourseByIdQueryFn,
  // Enrollment
  enrollCourseMutationFn,
  getEnrollmentStatusQueryFn,
  getMyEnrollmentsQueryFn,
  // Content
  getCourseContentTreeQueryFn,
  getLessonAccessQueryFn,
  getLessonContentQueryFn,
  // Upload
  uploadContentFileMutationFn,
  // Progress
  getCourseProgressQueryFn,
  markLessonCompleteMutationFn,
  // Reviews
  createReviewMutationFn,
  getCourseReviewsQueryFn,
  getMyReviewQueryFn,
} from "@/services/student/lms/courses/real-courses.api";

// Types
export type {
  StudentEnrollmentRow,
  LessonContentApiEnvelope,
  LessonContentResourceItem,
} from "@/services/student/lms/courses/real-courses.api";

export type {
  Course,
  Enrollment,
  CoursesResponse,
  LessonAccess,
  CourseContentTree,
  LessonContent,
  ContentUploadResponse,
  LessonProgress,
  StudentCourseProgress,
  CourseProgress,
  CourseReview,
  CreateReviewDto,
  ReviewsResponse,
} from "@/types/api/lms/courses.type";
