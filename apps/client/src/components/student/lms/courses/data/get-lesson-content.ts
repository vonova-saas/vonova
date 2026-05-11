import { getMockLessonById, getMockEnrollment } from "@/lib/mock-data/courses/storage";
import type {
  LessonContentApiEnvelope,
  LessonContentResourceItem,
} from "@/services/student/lms/courses/real-courses.api";

export type LessonContentType = {
  id: string;
  /** Real LMS course id (for progress API). */
  courseId: string;
  title: string;
  description: string;
  thumbnailKey: string | null;
  /** Legacy / mock: S3 object key. */
  videoKey: string | null;
  /** LMS presigned playback URL (preferred when present). */
  videoStreamUrl?: string | null;
  /** Same source as LMS `video.videoObjectKey` — use with streamUrl for UI (never gate on lesson.type). */
  videoObjectKey?: string | null;
  /** LMS presign or key validation failed — show fallback + retry when key exists. */
  videoError?: boolean;
  videoStreamError?: { code: string; reason: string } | null;
  videoPosterUrl?: string | null;
  lessonResources?: {
    materials: LessonContentResourceItem[];
    quizzes: LessonContentResourceItem[];
    problems: LessonContentResourceItem[];
  };
  position: number;
  lessonProgress: { completed: boolean; lessonId: string; userId: string }[];
  Chapter: {
    courseId: string;
    Course: {
      slug: string;
    };
  };
};

export function mapApiLessonContentToPageData(
  api: LessonContentApiEnvelope,
  courseId: string,
  courseSlug: string,
): LessonContentType {
  const l = api.lesson;
  if (!l) {
    throw new Error("Lesson missing from LMS content response");
  }

  /** Video fields: derive only from `lesson.video` — never type / hasVideo / videoUrl. */
  const video = l.video ?? null;
  const streamRaw = video?.streamUrl;
  const keyRaw = video?.videoObjectKey;
  const videoStreamUrl =
    streamRaw != null && String(streamRaw).trim() !== ""
      ? String(streamRaw).trim()
      : null;
  const videoObjectKey =
    keyRaw != null && String(keyRaw).trim() !== ""
      ? String(keyRaw).trim()
      : null;

  const poster =
    video?.thumbnailUrl ?? video?.posterUrl ?? null;
  const lessonId = String(l.id ?? (l as unknown as { _id?: string })._id ?? "");
  const lessonCompleted =
    (l as { lessonCompleted?: boolean }).lessonCompleted === true;

  return {
    id: lessonId,
    courseId,
    title: l.title,
    description: l.content ?? "",
    thumbnailKey: null,
    videoKey: null,
    videoStreamUrl,
    videoObjectKey,
    videoError: video?.videoError ?? false,
    videoStreamError: video?.error ?? null,
    videoPosterUrl: poster,
    lessonResources: l.resources ?? {
      materials: [],
      quizzes: [],
      problems: [],
    },
    position: 1,
    lessonProgress: lessonCompleted
      ? [
          {
            completed: true,
            lessonId,
            userId: "",
          },
        ]
      : [],
    Chapter: {
      courseId,
      Course: { slug: courseSlug },
    },
  };
}

/** @deprecated Local mock only — student lesson page uses the LMS API. */
export async function getLessonContent(lessonId: string, userId?: string) {
  const lesson = getMockLessonById(lessonId);

  if (!lesson) {
    return {
      id: lessonId,
      courseId: "demo-course",
      title: "Demo Lesson Content",
      description: "This is demo lesson content rendered without a backend.",
      thumbnailKey: null,
      videoKey: null,
      lessonResources: { materials: [], quizzes: [], problems: [] },
      position: 1,
      lessonProgress: [],
      Chapter: {
        courseId: "demo-course",
        Course: {
          slug: "demo-course-slug",
        },
      },
    } satisfies LessonContentType;
  }

  const enrollment = userId ? getMockEnrollment(lesson.courseId, userId) : undefined;
  const isCompleted = enrollment?.status === "COMPLETED" || false;
  const lessonProgress = isCompleted
    ? [{ completed: true, lessonId: lesson._id, userId: userId || "anonymous" }]
    : [];

  return {
    id: lesson._id,
    courseId: lesson.courseId,
    title: lesson.title,
    description: lesson.content || "",
    thumbnailKey: lesson.thumbnailKey || null,
    videoKey: lesson.videoKey || null,
    lessonResources: { materials: [], quizzes: [], problems: [] },
    position: lesson.index,
    lessonProgress,
    Chapter: {
      courseId: lesson.courseId,
      Course: {
        slug: "course-slug",
      },
    },
  } satisfies LessonContentType;
}
