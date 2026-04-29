// Mock API exports - using fake data stored in localStorage
// All functions are re-exported from the mock data layer

export {
  // Browse Courses
  getAllCoursesQueryFn,
  getCourseBySlugQueryFn,
  getCourseByIdQueryFn,
  // Enrollment
  enrollCourseMutationFn,
  getEnrollmentStatusQueryFn,
  // Content
  getCourseContentTreeQueryFn,
  getLessonAccessQueryFn,
  getLessonContentQueryFn,
  // Upload
  uploadContentFileMutationFn,
  // Progress
  getCourseProgressQueryFn,
  markLessonCompleteMutationFn,
} from "@/lib/mock-data/courses/student-api";

// Placeholder exports for functions not yet implemented in mock
export const createReviewMutationFn = async () => ({
  _id: "mock_review",
  message: "Review created",
});

export const getCourseReviewsQueryFn = async () => ({
  reviews: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  averageRating: 0,
  totalReviews: 0,
});

export const getMyReviewQueryFn = async () => {
  throw new Error("No review found");
};

// Types
export type {
  Course,
  Enrollment,
  CoursesResponse,
  LessonAccess,
  CourseContentTree,
  LessonContent,
  ContentUploadResponse,
  LessonProgress,
  CourseProgress,
  CourseReview,
  CreateReviewDto,
  ReviewsResponse,
} from "@/types/api/lms/courses.type";
