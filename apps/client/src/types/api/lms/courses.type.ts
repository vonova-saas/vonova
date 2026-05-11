// Course Types based on API documentation

export interface Price {
  amount: number;
  currency: string;
  isFree: boolean;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  smallDescription?: string;
  description?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  /** LMS enum; preferred over difficulty for new data */
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  tags?: string[];
  thumbnailUrl?: string;
  language?: string;
  price?: Price;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  ownerId?: string;
  /** Display name of the course owner (populated by the LMS service). */
  ownerName?: string;
  enrollmentCount?: number;
  averageRating?: number;
  completionRate?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
}

export interface Chapter {
  _id: string;
  courseId: string;
  title: string;
  index: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export type LessonType = "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" | "MIXED";

export interface Lesson {
  _id: string;
  courseId: string;
  chapterId: string;
  title: string;
  index: number;
  durationMinutes?: number;
  type?: LessonType;
  previewable?: boolean;
  content?: string;
  videoKey?: string;
  thumbnailKey?: string;
  quizId?: string | null;
  assignmentId?: string | null;
  /** Library material ids attached to this lesson (in display order). */
  materials?: string[];
  quizzes?: string[];
  problems?: string[];
  /** Presigned playback URL from GET lesson (not stored in DB) */
  streamUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  slug: string;
  smallDescription?: string;
  description?: string;
  difficulty?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  tags?: string[];
  thumbnailUrl?: string;
  thumbnailKey?: string;
  language?: string;
  price?: Price;
}

export interface UpdateCourseDto {
  title?: string;
  slug?: string;
  smallDescription?: string;
  description?: string;
  difficulty?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  tags?: string[];
  thumbnailUrl?: string;
  thumbnailKey?: string;
  language?: string;
  price?: Price;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface PublishCourseDto {
  status: "PUBLISHED" | "ARCHIVED";
}

export interface CoursesResponse {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseAggregatesResponse {
  message: string;
  enrollmentCount: number;
  averageRating: number;
  completionRate: number;
}

// Chapter Types
export interface CreateChapterDto {
  title: string;
  index?: number;
}

export interface UpdateChapterDto {
  title?: string;
  index?: number;
}

export interface ReorderChaptersDto {
  order: Array<{
    chapterId: string;
    index: number;
  }>;
}

export interface ChaptersResponse {
  chapters: Chapter[];
  currentPage: number;
  totalPages: number;
  totalChapters: number;
  limit: number;
}

// Lesson Types
export interface CreateLessonDto {
  title: string;
  index?: number;
  durationMinutes?: number;
  type?: LessonType;
  previewable?: boolean;
  content?: string;
  videoKey?: string;
  thumbnailKey?: string;
  quizId?: string;
  assignmentId?: string;
}

export interface UpdateLessonDto {
  title?: string;
  index?: number;
  durationMinutes?: number;
  type?: LessonType;
  previewable?: boolean;
  content?: string;
  videoKey?: string;
  thumbnailKey?: string;
  quizId?: string;
  assignmentId?: string;
}

export interface ReorderLessonsDto {
  order: Array<{
    lessonId: string;
    index: number;
  }>;
}

export interface VideoUploadUrlDto {
  objectKey: string;
  contentType: string;
}

/** @deprecated Legacy multipart response; lesson video uses presign-put + confirm */
export interface VideoUploadResponse {
  message: string;
  streamUrl?: string;
  objectKey: string;
  size: number;
}

export interface FileUploadResponse {
  message: string;
  fileUrl: string;
  objectKey: string;
  size: number;
  assetId: string;
}

// Enrollment Types
export interface Enrollment {
  _id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
  progress: number;
  completedLessons?: number;
  totalLessons?: number;
  lastAccessedAt?: string;
}

export interface EnrollCourseDto {
  couponCode?: string;
}

export interface LessonAccess {
  hasAccess: boolean;
  isPreviewable: boolean;
  isEnrolled: boolean;
  enrollmentStatus: "ACTIVE" | "INACTIVE" | "COMPLETED";
  lessonCompleted: boolean;
  nextLessonAvailable: boolean;
}

// Content Types (LMS content tree uses `id`; some gateways may use `_id`)
export interface ContentChapter {
  _id?: string;
  id?: string;
  title: string;
  index: number;
  lessons: ContentLesson[];
}

export interface ContentLesson {
  _id?: string;
  id?: string;
  title: string;
  index: number;
  content?: string;
  duration?: number;
  durationMinutes?: number;
}

export interface CourseContentTree {
  courseId?: string;
  course?: { id: string; title?: string };
  chapters: ContentChapter[];
}

export interface LessonContent {
  _id: string;
  title: string;
  content: string;
  type: LessonType;
  durationMinutes: number;
  resources: LessonResource[];
  isCompleted: boolean;
  progress: number;
  videoKey?: string;
  thumbnailKey?: string;
  /** Presigned URL from LMS lesson content endpoint. */
  videoStreamUrl?: string;
  /** LMS `video.videoObjectKey` — show video chrome when set (do not use lesson.type). */
  videoObjectKey?: string;
  videoError?: boolean;
  videoStreamError?: { code: string; reason: string } | null;
  videoPosterUrl?: string;
  quizId?: string | null;
  assignmentId?: string | null;
}

export interface LessonResource {
  type: "PDF" | "DOC" | "PPT" | "VIDEO" | "IMAGE";
  title: string;
  url: string;
}

export interface ContentUploadResponse {
  message: string;
  /** @deprecated Use objectKey + presigned GET; not returned for new uploads */
  fileUrl?: string;
  objectKey: string;
  size: number;
  assetId: string;
}

// Progress Types
export interface LessonProgress {
  _id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  timeSpentSec: number;
  completedAt: string;
}

export interface MarkLessonCompleteDto {
  completed: boolean;
  timeSpentSec?: number;
}

export interface ChapterProgress {
  chapterId: string;
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export interface NextLesson {
  lessonId: string;
  title: string;
  chapterTitle: string;
}

/** LMS GET /courses/:courseId/progress (aggregated; backed by LessonProgress + Enrollment). */
export interface StudentCourseProgress {
  success: true;
  courseId: string;
  studentId: string;
  completedLessonIds: string[];
  completedLessonsCount: number;
  totalLessons: number;
  progressPercentage: number;
  completed: boolean;
  lastLessonId: string | null;
  lastAccessedAt: string | null;
}

/** @deprecated Legacy shape — use StudentCourseProgress */
export interface CourseProgress {
  courseId: string;
  userId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  lastAccessedAt: string;
  chapters: ChapterProgress[];
  nextLesson?: NextLesson;
}

// Review Types
export interface CourseReview {
  _id: string;
  courseId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  user?: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewDto {
  rating: number;
  title?: string;
  body?: string;
}

export interface ReviewsResponse {
  reviews: CourseReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  totalReviews: number;
}

// Feedback Types
export interface FeedbackRequest {
  text: string;
}

export interface FeedbackResponse {
  sentiment: "positive" | "negative" | "neutral";
  code: number;
}
