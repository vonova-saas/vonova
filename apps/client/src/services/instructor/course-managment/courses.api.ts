// Real API implementation for Instructor Course Management
// Connects to the backend API Gateway

import API from "@/services/axios-client";
import { peelLmsResponseLayers, unwrapLmsData } from "@/lib/api/unwrap-lms-body";
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
  PublishCourseDto,
  ReorderChaptersDto,
  ReorderLessonsDto,
} from "@/types/api/lms/courses.type";

// ==================== COURSES ====================

export async function getInstructorCoursesQueryFn(): Promise<CoursesResponse> {
  const response = await API.get('/api/v1/lms/courses/my-courses');
  return response.data;
}

export async function getInstructorCourseByIdQueryFn(courseId: string): Promise<Course> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}`);
  const raw = unwrapLmsData<unknown>(response.data);
  if (raw == null || typeof raw !== "object") {
    throw new Error("Course not found or invalid response");
  }
  const r = raw as Record<string, unknown>;
  const id = r._id ?? r.id;
  if (id == null || String(id).trim() === "") {
    throw new Error("Course payload missing id");
  }
  return { ...r, _id: String(id) } as Course;
}

export async function getCourseDetailsQueryFn(courseId: string): Promise<{
  success: boolean;
  message: string;
  data: {
    course: Course;
    chaptersCount: number;
    lessonsCount: number;
    materialsCount: number;
    quizzesCount: number;
    problemsCount: number;
  };
}> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/details`);
  return response.data;
}

export async function createCourseMutationFn(data: FormData): Promise<{ message: string; data: Course }> {
  const response = await API.post('/api/v1/lms/courses/createCourse', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updateCourseMutationFn(
  courseId: string,
  data: UpdateCourseDto,
  imageFile?: File
): Promise<{ message: string; data: Course }> {
  const formData = new FormData();
  
  // Append all course data as JSON string under 'data' field
  formData.append('data', JSON.stringify(data));
  
  // Append image file if provided
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const response = await API.patch(`/api/v1/lms/courses/${courseId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return body as { message: string; data: Course };
  }
  return { message: "Course updated", data: body as Course };
}

export async function deleteCourseMutationFn(courseId: string): Promise<{ message: string }> {
  const response = await API.delete(`/api/v1/lms/courses/${courseId}`);
  return response.data;
}

export async function publishCourseMutationFn(
  courseId: string,
  status: "PUBLISHED" | "ARCHIVED"
): Promise<{ message: string; data: Course }> {
  const response = await API.patch(`/api/v1/lms/courses/${courseId}/publish`, { status });
  return response.data;
}

export async function recomputeCourseAggregatesMutationFn(courseId: string): Promise<{
  message: string;
  enrollmentCount: number;
  averageRating: number;
  completionRate: number;
}> {
  const response = await API.post(`/api/v1/lms/courses/${courseId}/recompute-aggregates`);
  return response.data;
}

// ==================== CHAPTERS ====================

export async function getChaptersQueryFn(courseId: string): Promise<{ message: string; data: Chapter[] }> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/chapters`);
  return response.data;
}

/**
 * Normalized chapter list for instructor UI. LMS/gateway may return
 * `{ chapters, totalPages, ... }`, a bare array, or a single chapter document.
 */
export async function getChaptersListForCourseQueryFn(courseId: string): Promise<Chapter[]> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/chapters`, {
    params: { page: 1, limit: 200 },
  });
  const peeled = peelLmsResponseLayers(response.data) as unknown;

  if (Array.isArray(peeled)) {
    return peeled as Chapter[];
  }

  if (peeled && typeof peeled === "object") {
    const o = peeled as Record<string, unknown>;
    if (Array.isArray(o.chapters)) {
      return o.chapters as Chapter[];
    }
    if (Array.isArray(o.data)) {
      return o.data as Chapter[];
    }
    if (o._id != null && o.title != null) {
      return [peeled as Chapter];
    }
  }

  return [];
}

export async function createChapterMutationFn(
  courseId: string,
  data: CreateChapterDto
): Promise<{ message: string; data: Chapter }> {
  const response = await API.post(`/api/v1/lms/courses/${courseId}/chapters`, data);
  return response.data;
}

export async function updateChapterMutationFn(
  courseId: string,
  chapterId: string,
  data: UpdateChapterDto
): Promise<{ message: string; data: Chapter }> {
  const response = await API.patch(`/api/v1/lms/courses/${courseId}/chapters/${chapterId}`, data);
  return response.data;
}

export async function deleteChapterMutationFn(courseId: string, chapterId: string): Promise<{ message: string }> {
  const response = await API.delete(`/api/v1/lms/courses/${courseId}/chapters/${chapterId}`);
  return response.data;
}

export async function reorderChaptersMutationFn(
  courseId: string,
  dto: ReorderChaptersDto
): Promise<{ message: string; data: Chapter[] }> {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/reorder`,
    dto
  );
  return response.data;
}

// ==================== LESSONS ====================

export async function getChapterLessonsQueryFn(courseId: string, chapterId: string): Promise<{ message: string; data: Lesson[] }> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons`);
  return response.data;
}

function toIdString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null && "_id" in (v as object)) {
    return toIdString((v as { _id?: unknown })._id);
  }
  try {
    return String(v);
  } catch {
    return undefined;
  }
}

function streamUrlFromLessonPayload(raw: Record<string, unknown>): string | undefined {
  const v = raw.video;
  if (v && typeof v === "object" && v !== null && "streamUrl" in v) {
    const s = (v as Record<string, unknown>).streamUrl;
    if (s != null && String(s).trim()) return String(s);
  }
  if (raw.streamUrl != null && String(raw.streamUrl).trim()) {
    return String(raw.streamUrl);
  }
  return undefined;
}

function mapLessonFromApi(raw: Record<string, unknown>): Lesson {
  const id = toIdString(raw._id) ?? toIdString(raw.id) ?? "";
  const toStrArr = (v: unknown) =>
    Array.isArray(v)
      ? (v.map((x) => toIdString(x)).filter(Boolean) as string[])
      : [];

  return {
    _id: id,
    courseId: toIdString(raw.courseId) ?? "",
    chapterId: toIdString(raw.chapterId) ?? "",
    title: String(raw.title ?? ""),
    index: Number(raw.index ?? 0),
    durationMinutes:
      raw.durationMinutes != null ? Number(raw.durationMinutes) : undefined,
    type: raw.type as Lesson["type"],
    previewable: Boolean(raw.previewable),
    content: raw.content != null ? String(raw.content) : undefined,
    videoKey:
      raw.videoKey != null
        ? String(raw.videoKey)
        : raw.videoObjectKey != null
          ? String(raw.videoObjectKey)
          : undefined,
    thumbnailKey:
      raw.thumbnailKey != null ? String(raw.thumbnailKey) : undefined,
    quizId: raw.quizId != null ? String(raw.quizId) : null,
    assignmentId:
      raw.assignmentId != null ? String(raw.assignmentId) : null,
    materials: toStrArr(raw.materials),
    quizzes: toStrArr(raw.quizzes),
    problems: toStrArr(raw.problems),
    streamUrl: streamUrlFromLessonPayload(raw),
    createdAt:
      raw.createdAt != null ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt:
      raw.updatedAt != null ? String(raw.updatedAt) : new Date().toISOString(),
  };
}

export async function getLessonByIdQueryFn(
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<{ message: string; data: Lesson }> {
  const response = await API.get(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
  );
  const body = response.data as Record<string, unknown>;
  const rawLesson = (body?.data ?? body?.lesson) as
    | Record<string, unknown>
    | undefined;
  if (!rawLesson) {
    throw new Error("Lesson not found in API response");
  }
  return {
    message: String(body?.message ?? "Lesson retrieved successfully"),
    data: mapLessonFromApi(rawLesson),
  };
}

/**
 * Lesson write payloads: use `videoKey` on the wire (gateway/LMS DTOs).
 * Never send `videoObjectKey` from the client — some deployed gateways only whitelist `videoKey`;
 * LMS maps `videoKey` → `videoObjectKey` on the document.
 */
function toLessonWriteBody(data: CreateLessonDto | UpdateLessonDto): Record<string, unknown> {
  const body = { ...(data as Record<string, unknown>) };
  delete body.videoObjectKey;
  return body;
}

/** LMS returns `{ message, lesson }`; some routes use `{ message, data }`. */
function parseLessonMutationResponseBody(body: unknown): Lesson {
  const b = body as Record<string, unknown>;
  const raw = (b?.data ?? b?.lesson) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") {
    throw new Error("Lesson not found in API response");
  }
  return mapLessonFromApi(raw);
}

export async function createLessonMutationFn(
  courseId: string,
  chapterId: string,
  data: CreateLessonDto
): Promise<{ message: string; data: Lesson }> {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons`,
    toLessonWriteBody(data)
  );
  const body = response.data as Record<string, unknown>;
  return {
    message: String(body?.message ?? "Lesson created successfully"),
    data: parseLessonMutationResponseBody(body),
  };
}

export async function updateLessonMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: UpdateLessonDto
): Promise<{ message: string; data: Lesson }> {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
    toLessonWriteBody(data)
  );
  const body = response.data as Record<string, unknown>;
  return {
    message: String(body?.message ?? "Lesson updated successfully"),
    data: parseLessonMutationResponseBody(body),
  };
}

export async function deleteLessonMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string
): Promise<{ message: string }> {
  const response = await API.delete(`/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  return response.data;
}

export async function reorderLessonsMutationFn(
  courseId: string,
  chapterId: string,
  dto: ReorderLessonsDto
): Promise<{ message: string; data: Lesson[] }> {
  const response = await API.patch(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/reorder`,
    dto
  );
  return response.data;
}

// ==================== CONTENT UPLOAD ====================

export async function uploadFileMutationFn(
  courseId: string,
  contentType: "lesson" | "chapter" | "course",
  contentId: string,
  file: File
): Promise<ContentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/content/upload?contentType=${contentType}&contentId=${contentId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
}

/** Presigned PUT for direct browser → S3 lesson video upload. */
export async function getLessonVideoPresignedPutMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string,
  body: { fileName: string; contentType: string },
): Promise<{ uploadUrl: string; objectKey: string }> {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/video/presign-put`,
    body,
  );
  const peeled = peelLmsResponseLayers(response.data) as Record<string, unknown> | null;
  const uploadUrl = String(peeled?.uploadUrl ?? "").trim();
  const objectKey = String(peeled?.objectKey ?? "").trim();
  if (!uploadUrl || !objectKey) {
    throw new Error("Presign response missing uploadUrl or objectKey");
  }
  return { uploadUrl, objectKey };
}

/** After successful PUT to S3, persist videoObjectKey on the lesson. */
export async function confirmLessonVideoUploadMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string,
  objectKey: string,
  fileSize?: number,
): Promise<{ message: string; objectKey: string }> {
  const response = await API.post(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/video/confirm`,
    { objectKey, fileSize },
  );
  const body = response.data as Record<string, unknown>;
  const inner = peelLmsResponseLayers(body) as Record<string, unknown> | null;
  const message = String(inner?.message ?? body?.message ?? "Lesson video confirmed");
  const key = String(inner?.objectKey ?? inner?.videoObjectKey ?? body?.objectKey ?? objectKey).trim();
  return { message, objectKey: key || objectKey };
}

/** Presigned GET for a lesson video object key (instructor preview / player). */
export async function getLessonVideoPresignedUrlMutationFn(
  courseId: string,
  chapterId: string,
  lessonId: string,
  objectKey: string,
  contentType = "video/mp4",
): Promise<{ streamUrl: string }> {
  const response = await API.post<{ streamUrl: string }>(
    `/api/v1/lms/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/video/url`,
    { objectKey, contentType },
  );
  const peeled = peelLmsResponseLayers(response.data) as Record<string, unknown> | null;
  const streamUrl = String(peeled?.streamUrl ?? "").trim();
  if (!streamUrl) {
    throw new Error("Video URL response missing streamUrl");
  }
  return { streamUrl };
}

// ==================== COURSE CONTENT TREE ====================

export async function getCourseContentTreeQueryFn(
  courseId: string,
): Promise<CourseContentTree> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/content`);
  return unwrapLmsData<CourseContentTree>(response.data);
}

// ==================== INSTRUCTOR COURSE WITH CHAPTERS ====================

export async function getInstructorCourseWithChaptersQueryFn(
  courseId: string
): Promise<{ message: string; data: Course & { chapters: (Chapter & { lessons: Lesson[] })[] } }> {
  const response = await API.get(`/api/v1/lms/courses/${courseId}/with-chapters`);
  return response.data;
}

// Types
export type {
  ChaptersResponse,
  VideoUploadUrlDto,
  VideoUploadResponse,
  FileUploadResponse,
} from "@/types/api/lms/courses.type";
