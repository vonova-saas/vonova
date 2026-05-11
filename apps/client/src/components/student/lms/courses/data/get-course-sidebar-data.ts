"use client";

import {
  getCourseByIdQueryFn,
  getCourseBySlugQueryFn,
  getCourseContentTreeQueryFn,
} from "@/services/student/lms/courses/real-courses.api";
import type { Course, CourseContentTree } from "@/types/api/lms/courses.type";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";

interface LessonProgress {
  lessonId: string;
  completed: boolean;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** LMS / gateway may return `_id`, `id`, or Mongo-shaped values. */
function pickEntityId(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length ? s : undefined;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  const o = asRecord(raw);
  if (typeof o.$oid === "string" && o.$oid.trim()) return o.$oid.trim();
  if (
    typeof (raw as { toString?: () => string }).toString === "function"
  ) {
    const s = (raw as { toString: () => string }).toString().trim();
    if (s && s !== "[object Object]") return s;
  }
  return undefined;
}

function coursePrimaryId(course: Course): string | undefined {
  return (
    pickEntityId(course._id) ??
    pickEntityId(asRecord(course).id) ??
    pickEntityId(asRecord(course)._id)
  );
}

/** Content tree payload varies: flat chapters, or nested under `data`. */
function normalizeContentTreePayload(body: unknown): CourseContentTree {
  const top = asRecord(body);
  const inner = asRecord(top.data);
  const chaptersSource =
    (Array.isArray(top.chapters) ? top.chapters : null) ??
    (Array.isArray(inner.chapters) ? inner.chapters : null) ??
    [];

  const courseId =
    (typeof top.courseId === "string" && top.courseId) ||
    (typeof inner.courseId === "string" && inner.courseId) ||
    (() => {
      const c = asRecord(top.course ?? inner.course);
      return pickEntityId(c.id) ?? pickEntityId(c._id);
    })() ||
    "";

  return {
    courseId,
    chapters: chaptersSource as CourseContentTree["chapters"],
  };
}

const MONGO_ID_24 = /^[a-fA-F0-9]{24}$/;

/**
 * @param courseIdHint – When present (e.g. `?cid=` from instructor Preview), load by id first so DRAFT owner access matches GET /courses/:id (same NATS user envelope as slug-only edge cases).
 */
export async function getCourseSidebarData(
  slug: string,
  courseIdHint?: string | null,
) {
  try {
    const hint = courseIdHint?.trim() ?? "";
    let course: Course | null = null;

    if (hint && MONGO_ID_24.test(hint)) {
      course = await getCourseByIdQueryFn(hint).catch(() => null);
    }
    if (!course) {
      course = await getCourseBySlugQueryFn(slug);
    }

    if (!course) {
      throw new Error("Course not found");
    }

    const courseId = coursePrimaryId(course);
    if (!courseId) {
      throw new Error("Course payload missing id");
    }

    let contentTree: CourseContentTree = {
      courseId,
      chapters: [],
    };

    try {
      const rawTree = await getCourseContentTreeQueryFn(courseId);
      contentTree = normalizeContentTreePayload(rawTree);
    } catch (treeErr) {
      // Sidebar can still show course shell (e.g. tree blocked, slug OK).
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[getCourseSidebarData] content tree unavailable:",
          getErrorMessageFromUnknown(treeErr),
        );
      }
    }

    const chapterData = (contentTree.chapters || []).map(
      (chapter, chapterIndex) => {
        const ch = asRecord(chapter);
        const chapterId =
          pickEntityId(ch._id) ??
          pickEntityId(ch.id) ??
          `chapter-${chapterIndex}`;

        const rawLessons = Array.isArray(ch.lessons)
          ? (ch.lessons as unknown[])
          : [];

        return {
          id: chapterId,
          title: String(ch.title ?? "Chapter"),
          position: Number(ch.index ?? chapterIndex + 1),
          lessons: rawLessons.map((lesson, lessonIndex) => {
            const le = asRecord(lesson);
            const lessonId =
              pickEntityId(le._id) ??
              pickEntityId(le.id) ??
              `lesson-${chapterIndex}-${lessonIndex}`;

            return {
              id: lessonId,
              title: String(le.title ?? "Lesson"),
              position: Number(le.index ?? lessonIndex + 1),
              description: String(le.content ?? ""),
              lessonProgress: [] as LessonProgress[],
            };
          }),
        };
      },
    );

    return {
      course: {
        id: courseId,
        title: course.title,
        fileKey: course.thumbnailUrl || "",
        duration: 0,
        level: course.difficulty || course.level || "BEGINNER",
        category: course.tags?.[0] || course.category || "General",
        slug: course.slug,
        chapter: chapterData,
      },
    };
  } catch (error) {
    console.error(
      "Error fetching course sidebar data:",
      getErrorMessageFromUnknown(error),
    );
    return {
      course: {
        id: "error-course-" + slug,
        title: "Course Not Found",
        fileKey: "",
        duration: 0,
        level: "BEGINNER",
        category: "General",
        slug,
        chapter: [],
      },
    };
  }
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
