import API from "@/services/axios-client";
import {
  peelLmsResponseLayers,
  unwrapLmsData,
  unwrapLmsDataDeep,
} from "@/lib/api/unwrap-lms-body";
import type {
  Course,
  CoursesResponse,
  Enrollment,
  CourseContentTree,
  LessonAccess,
  StudentCourseProgress,
  CourseReview,
  ReviewsResponse,
  CreateReviewDto,
} from "@/types/api/lms/courses.type";
import type {
  LessonCompletionRequirements,
  LessonProgressionState,
} from "@/types/api/lms/progression.type";

function normalizeCourseFromResponse(body: unknown): Course {
  const peeled = peelLmsResponseLayers(body) as unknown;
  if (peeled && typeof peeled === "object") {
    const o = peeled as Record<string, unknown>;
    const id = o._id ?? o.id;
    if (id != null && String(id).trim() !== "") {
      return { ...o, _id: String(id) } as Course;
    }
  }
  return unwrapLmsData<Course>(body);
}

// Browse Courses
export const getAllCoursesQueryFn = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  difficulty?: string;
  category?: string;
  level?: string;
  isFree?: boolean | string;
  instructorId?: string;
}): Promise<CoursesResponse> => {
  const response = await API.get('/api/v1/lms/courses', { params });
  return response.data;
};

export const getCourseBySlugQueryFn = async (slug: string): Promise<Course> => {
  const response = await API.get(`/api/v1/lms/courses/slug/${slug}`);
  return normalizeCourseFromResponse(response.data);
};

export const getCourseByIdQueryFn = async (courseId: string): Promise<Course> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}`);
  return normalizeCourseFromResponse(response.data);
};

// Enrollment
export const enrollCourseMutationFn = async (
  courseId: string,
  couponCode?: string,
): Promise<Enrollment> => {
  const response = await API.post(`/api/v1/lms/courses/${courseId}/enroll`, { couponCode });
  return unwrapLmsData<Enrollment>(response.data);
};

export const getEnrollmentStatusQueryFn = async (courseId: string): Promise<Enrollment | null> => {
  try {
    const response = await API.get(`/api/v1/lms/courses/${courseId}/enrollment`);
    return unwrapLmsData<Enrollment>(response.data);
  } catch {
    return null;
  }
};

export type StudentEnrollmentRow = {
  course: Course;
  progress: number;
  status: string;
  enrollmentId?: string;
};

export const getMyEnrollmentsQueryFn = async (): Promise<StudentEnrollmentRow[]> => {
  const response = await API.get('/api/v1/lms/student/enrollments');
  const data = unwrapLmsData<StudentEnrollmentRow[]>(response.data) ?? [];
  return Array.isArray(data) ? data : [];
};

// Content
export const getCourseContentTreeQueryFn = async (
  courseId: string,
): Promise<CourseContentTree> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/content`);
  return unwrapLmsDataDeep<CourseContentTree>(response.data);
};

export const getLessonAccessQueryFn = async (courseId: string, lessonId: string): Promise<{ message: string; data: LessonAccess }> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/lessons/${lessonId}/access`);
  return response.data;
};

/** Raw LMS envelope for GET .../content/lessons/:id/content */
export type LessonContentResourceItem = {
  id: string;
  title: string;
  kind: 'material' | 'quiz' | 'problem';
  materialType?: 'book' | 'guide' | 'presentation';
};

export type LessonContentApiEnvelope = {
  access?: boolean;
  reason?: string;
  lesson: {
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    content?: string;
    /** Always present from LMS; optional for older gateways. */
    video?: {
      streamUrl?: string | null;
      videoObjectKey?: string | null;
      videoError?: boolean;
      error?: { code: string; reason: string };
      posterUrl?: string;
      thumbnailUrl?: string;
    };
    resources?: {
      materials: LessonContentResourceItem[];
      quizzes: LessonContentResourceItem[];
      problems: LessonContentResourceItem[];
    };
    /** Whether the current user has marked this lesson complete (LMS content service). */
    lessonCompleted?: boolean;
    computedCompletionRequirements?: LessonCompletionRequirements;
  } & Partial<LessonProgressionState>;
};

export type LessonWatchProgress = Omit<
  LessonProgressionState,
  "watchThreshold"
> & {
  threshold: number;
};

/**
 * Unwrap nested `{ data: ... }` (single or repeated) until `lesson` is present.
 * Prevents silent loss of `lesson.video` when BFF/gateway wraps the LMS payload.
 */
export function normalizeLessonContentEnvelope(body: unknown): LessonContentApiEnvelope {
  let cur: unknown = body;
  for (let depth = 0; depth < 12; depth++) {
    if (
      cur &&
      typeof cur === "object" &&
      "lesson" in cur &&
      (cur as { lesson: unknown }).lesson != null
    ) {
      const env = cur as LessonContentApiEnvelope;
      const L = env.lesson as unknown as Record<string, unknown>;
      if (L && L.id == null && L._id != null) {
        return {
          ...env,
          lesson: { ...L, id: String(L._id) } as LessonContentApiEnvelope["lesson"],
        };
      }
      return env;
    }
    if (cur && typeof cur === "object" && "data" in cur) {
      const next = (cur as { data: unknown }).data;
      if (next != null) {
        cur = next;
        continue;
      }
    }
    break;
  }
  const once = unwrapLmsData<LessonContentApiEnvelope>(body);
  if (once !== body) {
    return normalizeLessonContentEnvelope(once);
  }
  return body as LessonContentApiEnvelope;
}

export const getLessonContentQueryFn = async (
  courseId: string,
  lessonId: string,
): Promise<LessonContentApiEnvelope> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/content/lessons/${lessonId}/content`,
  );
  return normalizeLessonContentEnvelope(response.data as unknown);
};

// Upload
export const uploadContentFileMutationFn = async (formData: FormData): Promise<{ message: string; data: { fileUrl: string; assetId: string } }> => {
  const response = await API.post('/api/v1/lms/content/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Progress
function parseStudentCourseProgress(
  body: unknown,
  courseId: string,
): StudentCourseProgress {
  const raw = unwrapLmsData<Record<string, unknown>>(body);
  const totalLessons = Number(raw.totalLessons ?? 0);
  const completedLessonsCount = Number(
    raw.completedLessonsCount ?? raw.completedLessons ?? 0,
  );
  const completedLessonIds = Array.isArray(raw.completedLessonIds)
    ? (raw.completedLessonIds as unknown[]).map((id) => String(id))
    : [];
  const progressPercentage =
    typeof raw.progressPercentage === "number"
      ? raw.progressPercentage
      : typeof raw.percent === "number"
        ? raw.percent
        : totalLessons > 0
          ? Math.round((completedLessonsCount / totalLessons) * 100)
          : 0;

  const completed =
    typeof raw.completed === "boolean"
      ? raw.completed
      : totalLessons > 0 && completedLessonsCount >= totalLessons;

  return {
    success: true,
    courseId: String(raw.courseId ?? courseId),
    studentId: String(raw.studentId ?? ""),
    completedLessonIds,
    completedLessonsCount,
    totalLessons,
    progressPercentage,
    completed,
    lastLessonId:
      raw.lastLessonId != null && String(raw.lastLessonId).trim() !== ""
        ? String(raw.lastLessonId)
        : null,
    lastAccessedAt:
      raw.lastAccessedAt != null && String(raw.lastAccessedAt).trim() !== ""
        ? String(raw.lastAccessedAt)
        : null,
  };
}

export const getCourseProgressQueryFn = async (
  courseId: string,
): Promise<StudentCourseProgress> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/progress`);
  return parseStudentCourseProgress(
    unwrapLmsDataDeep<unknown>(response.data),
    courseId,
  );
};

export const markLessonCompleteMutationFn = async (
  courseId: string,
  lessonId: string,
  data: { completed: boolean; timeSpentSec?: number },
): Promise<unknown> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/complete`,
    data,
  );
  return response.data;
};

export const updateLessonWatchMutationFn = async (
  courseId: string,
  lessonId: string,
  data: { currentTime: number; duration: number },
): Promise<LessonWatchProgress> => {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/watch`,
    data,
  );
  return unwrapLmsDataDeep<LessonWatchProgress>(response.data);
};

export const getLessonWatchQueryFn = async (
  courseId: string,
  lessonId: string,
): Promise<LessonWatchProgress> => {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/lessons/${lessonId}/watch`,
  );
  return unwrapLmsDataDeep<LessonWatchProgress>(response.data);
};

// Reviews
export const createReviewMutationFn = async (courseId: string, data: CreateReviewDto): Promise<{ message: string; data: CourseReview }> => {
  const response = await API.post(`/api/v1/lms/courses/${courseId}/reviews`, data);
  return response.data;
};

export const getCourseReviewsQueryFn = async (
  courseId: string, 
  params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/reviews`, { params });
  return response.data;
};

export const getMyReviewQueryFn = async (courseId: string): Promise<{ message: string; data: CourseReview }> => {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/reviews/my-review`);
  return response.data;
};
