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
  tags?: string[];
  thumbnailUrl?: string;
  language?: string;
  price?: Price;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  ownerId?: string;
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

export interface Lesson {
  _id: string;
  courseId: string;
  chapterId: string;
  title: string;
  index: number;
  durationMinutes?: number;
  type?: "VIDEO" | "ARTICLE" | "QUIZ";
  previewable?: boolean;
  content?: string;
  videoKey?: string;
  thumbnailKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  slug: string;
  smallDescription?: string;
  description?: string;
  difficulty?: string;
  tags?: string[];
  thumbnailUrl?: string;
  language?: string;
  price?: Price;
}

export interface UpdateCourseDto {
  title?: string;
  slug?: string;
  smallDescription?: string;
  description?: string;
  difficulty?: string;
  tags?: string[];
  thumbnailUrl?: string;
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
  type?: "VIDEO" | "ARTICLE" | "QUIZ";
  previewable?: boolean;
  content?: string;
}

export interface UpdateLessonDto {
  title?: string;
  index?: number;
  durationMinutes?: number;
  type?: "VIDEO" | "ARTICLE" | "QUIZ";
  previewable?: boolean;
  content?: string;
  videoKey?: string;
  thumbnailKey?: string;
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

export interface VideoUploadResponse {
  message: string;
  videoUrl: string;
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

// Content Types
export interface ContentChapter {
  _id: string;
  title: string;
  index: number;
  lessons: ContentLesson[];
}

export interface ContentLesson {
  _id: string;
  title: string;
  index: number;
  content?: string;
  duration?: number;
}

export interface CourseContentTree {
  courseId: string;
  chapters: ContentChapter[];
}

export interface LessonContent {
  _id: string;
  title: string;
  content: string;
  type: "VIDEO" | "ARTICLE" | "QUIZ";
  durationMinutes: number;
  resources: LessonResource[];
  isCompleted: boolean;
  progress: number;
}

export interface LessonResource {
  type: "PDF" | "DOC" | "PPT" | "VIDEO" | "IMAGE";
  title: string;
  url: string;
}

export interface ContentUploadResponse {
  message: string;
  fileUrl: string;
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
