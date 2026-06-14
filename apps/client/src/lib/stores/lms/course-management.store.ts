import { create } from "zustand";
import {
  getInstructorCoursesQueryFn,
  getInstructorCourseByIdQueryFn,
  getChaptersListForCourseQueryFn,
  createCourseMutationFn,
  updateCourseMutationFn,
  deleteCourseMutationFn,
  createChapterMutationFn,
  updateChapterMutationFn,
  deleteChapterMutationFn,
  reorderChaptersMutationFn,
  createLessonMutationFn,
  updateLessonMutationFn,
  deleteLessonMutationFn,
  reorderLessonsMutationFn,
} from "@/services/instructor/course-managment/courses.api";
import {
  getCourseContentTreeQueryFn,
  uploadContentFileMutationFn,
} from "@/services/student/lms/courses/real-courses.api";
import { unwrapLmsData } from "@/lib/api/unwrap-lms-body";
import { scheduleInvalidateLmsMediaForCourse } from "@/lib/lms/invalidate-lms-media-queries";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import type {
  Course,
  CourseContentTree,
  Chapter,
  Lesson,
  ContentChapter,
  ContentLesson,
  UpdateCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderChaptersDto,
  ReorderLessonsDto,
} from "@/types/api/lms/courses.type";

function contentNodeId(node: { _id?: string; id?: string }): string {
  const raw = node._id ?? node.id;
  return raw != null ? String(raw) : "";
}

function contentChapterToStoreChapter(
  ch: ContentChapter,
  treeCourseId: string,
  prevLessons: Record<string, Lesson>,
): Chapter {
  const chapterId = contentNodeId(ch);
  return {
    _id: chapterId,
    courseId: treeCourseId,
    title: ch.title,
    index: ch.index,
    lessons: (ch.lessons || []).map((l: ContentLesson) => {
      const lessonId = contentNodeId(l);
      const ext = l as ContentLesson & { videoKey?: string; streamUrl?: string };
      const base: Lesson = {
        _id: lessonId,
        courseId: treeCourseId,
        chapterId,
        title: l.title,
        index: l.index,
        content: l.content,
        durationMinutes: l.durationMinutes ?? l.duration ?? 0,
        videoKey: ext.videoKey != null ? String(ext.videoKey) : undefined,
        streamUrl: ext.streamUrl != null ? String(ext.streamUrl) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const prev = prevLessons[lessonId];
      return {
        ...base,
        videoKey: base.videoKey ?? prev?.videoKey,
        streamUrl: base.streamUrl ?? prev?.streamUrl,
      };
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Chapter;
}

/** When GET /content returns no rows but chapters exist in the chapter collection. */
function listedChapterRowToContentChapter(row: Chapter): ContentChapter {
  const cid = String(row._id ?? "");
  const raw = row.lessons ?? [];
  const lessons: ContentLesson[] = raw.map((l, i) => {
    if (typeof l === "string") {
      return { id: l, _id: l, title: "Lesson", index: i + 1 };
    }
    const lo = l as Lesson;
    return {
      id: lo._id,
      _id: lo._id,
      title: lo.title,
      index: lo.index,
      content: lo.content,
      durationMinutes: lo.durationMinutes,
    };
  });
  return {
    id: cid,
    _id: cid,
    title: row.title,
    index: row.index,
    lessons,
  };
}

/**
 * Content-tree GET can lag behind lesson writes. Lessons already in `lessonsById`
 * (e.g. just created) may be missing from the tree until the next content sync.
 * Merge those orphans back into their chapter so the instructor UI stays correct.
 */
function mergeOrphanLessonsFromCache(
  courseId: string,
  chapters: Chapter[],
  prevLessons: Record<string, Lesson>,
): Chapter[] {
  const seen = new Set<string>();
  for (const ch of chapters) {
    for (const l of ch.lessons || []) {
      if (l._id) seen.add(String(l._id));
    }
  }

  const next = chapters.map((ch) => ({
    ...ch,
    lessons: [...(ch.lessons || [])],
  }));

  for (const lesson of Object.values(prevLessons)) {
    if (!lesson?._id) continue;
    if (String(lesson.courseId) !== String(courseId)) continue;
    const lid = String(lesson._id);
    if (seen.has(lid)) continue;

    const chapterId = lesson.chapterId != null ? String(lesson.chapterId) : "";
    if (!chapterId) continue;

    const chIdx = next.findIndex((c) => String(c._id) === chapterId);
    if (chIdx < 0) continue;

    const merged: Lesson = {
      ...lesson,
      courseId: String(courseId),
      chapterId,
      createdAt: lesson.createdAt ?? new Date().toISOString(),
      updatedAt: lesson.updatedAt ?? new Date().toISOString(),
    };

    next[chIdx].lessons = [...(next[chIdx].lessons || []), merged].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    seen.add(lid);
  }

  return next;
}

// Wrapper functions to extract data from API responses
const api = {
  createCourse: async (payload: FormData) => {
    const res = await createCourseMutationFn(payload);
    return unwrapLmsData<Course>(res);
  },
  updateCourse: async (courseId: string, payload: UpdateCourseDto) => {
    const res = await updateCourseMutationFn(courseId, payload);
    return unwrapLmsData<Course>(res);
  },
  createChapter: async (courseId: string, payload: CreateChapterDto) => {
    const res = await createChapterMutationFn(courseId, payload);
    return res.data;
  },
  updateChapter: async (courseId: string, chapterId: string, payload: UpdateChapterDto) => {
    const res = await updateChapterMutationFn(courseId, chapterId, payload);
    return res.data;
  },
  createLesson: async (courseId: string, chapterId: string, payload: CreateLessonDto) => {
    const res = await createLessonMutationFn(courseId, chapterId, payload);
    return res.data;
  },
  updateLesson: async (courseId: string, chapterId: string, lessonId: string, payload: UpdateLessonDto) => {
    const res = await updateLessonMutationFn(courseId, chapterId, lessonId, payload);
    return res.data;
  },
};

type CourseWithChapters = Course & {
  chapters: Chapter[];
};

type CourseManagementStore = {
  // Data
  coursesById: Record<string, Course>;
  allCourseIds: string[];
  currentCourse: CourseWithChapters | null;
  chaptersById: Record<string, Chapter>;
  lessonsById: Record<string, Lesson>;

  // Loading states
  loading: boolean;
  error: string | null;
  actionLoading: boolean;

  // Actions - Courses
  fetchCourses: () => Promise<void>;
  fetchCourseById: (courseId: string) => Promise<CourseWithChapters | null>;
  createCourse: (payload: FormData) => Promise<Course | null>;
  updateCourse: (courseId: string, payload: UpdateCourseDto) => Promise<Course | null>;
  deleteCourse: (courseId: string) => Promise<boolean>;

  // Actions - Chapters
  createChapter: (courseId: string, payload: CreateChapterDto) => Promise<Chapter | null>;
  updateChapter: (courseId: string, chapterId: string, payload: UpdateChapterDto) => Promise<Chapter | null>;
  deleteChapter: (courseId: string, chapterId: string) => Promise<boolean>;
  reorderChapters: (courseId: string, data: ReorderChaptersDto) => Promise<boolean>;

  // Actions - Lessons
  createLesson: (courseId: string, chapterId: string, payload: CreateLessonDto) => Promise<Lesson | null>;
  updateLesson: (courseId: string, chapterId: string, lessonId: string, payload: UpdateLessonDto) => Promise<Lesson | null>;
  deleteLesson: (courseId: string, chapterId: string, lessonId: string) => Promise<boolean>;
  reorderLessons: (courseId: string, chapterId: string, data: ReorderLessonsDto) => Promise<boolean>;

  // Actions - Content Upload
  uploadContent: (courseId: string, file: File, contentType: "lesson" | "chapter" | "course", contentId: string) => Promise<{ fileUrl: string; objectKey: string } | null>;

  // Helpers
  clearError: () => void;
  setCurrentCourse: (course: CourseWithChapters | null) => void;
  /** Merge a fresh lesson (e.g. after video upload + GET lesson) into currentCourse + lessonsById. */
  applyLessonSnapshot: (lesson: Lesson) => void;
};

export const useCourseManagementStore = create<CourseManagementStore>((set, get) => ({
  // Initial state
  coursesById: {},
  allCourseIds: [],
  currentCourse: null,
  chaptersById: {},
  lessonsById: {},
  loading: false,
  error: null,
  actionLoading: false,

  clearError: () => set({ error: null }),
  setCurrentCourse: (course) => set({ currentCourse: course }),

  applyLessonSnapshot: (lesson) =>
    set((st) => {
      const cc = st.currentCourse;
      if (!cc || String(cc._id) !== String(lesson.courseId)) {
        return {
          lessonsById: {
            ...st.lessonsById,
            [lesson._id]: { ...st.lessonsById[lesson._id], ...lesson },
          },
        };
      }
      const chapters = cc.chapters.map((ch) => {
        if (String(ch._id) !== String(lesson.chapterId)) return ch;
        return {
          ...ch,
          lessons: (ch.lessons || []).map((l) =>
            String(l._id) === String(lesson._id) ? { ...l, ...lesson } : l,
          ),
        };
      });
      return {
        currentCourse: { ...cc, chapters },
        lessonsById: {
          ...st.lessonsById,
          [lesson._id]: { ...st.lessonsById[lesson._id], ...lesson },
        },
      };
    }),

  // ==================== COURSES ====================
  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getInstructorCoursesQueryFn();
      const list = Array.isArray(res) ? res : res.items || [];
      const map: Record<string, Course> = {};
      const ids: string[] = [];
      for (const c of list) {
        map[c._id] = c;
        ids.push(c._id);
      }
      set({ coursesById: map, allCourseIds: ids });
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to load courses" });
    } finally {
      set({ loading: false });
    }
  },

  fetchCourseById: async (courseId: string) => {
    const previousCourse = get().currentCourse;
    const showFullPageLoader =
      !previousCourse || String(previousCourse._id) !== String(courseId);

    set({
      ...(showFullPageLoader ? { loading: true } : {}),
      error: null,
    });

    try {
      const prevLessons = get().lessonsById;

      // Fetch both course details and content tree in parallel
      const [course, tree] = await Promise.all([
        getInstructorCourseByIdQueryFn(courseId),
        getCourseContentTreeQueryFn(courseId).catch((): CourseContentTree => ({
          courseId,
          chapters: [],
        })),
      ]);

      if (course == null || typeof course !== "object" || !course._id) {
        throw new Error("Course not found or invalid response");
      }

      const contentTree = tree;
      const treeCourseId =
        contentTree.courseId ??
        contentTree.course?.id ??
        courseId;

      let chapters: Chapter[] = (contentTree.chapters || []).map((ch: ContentChapter) =>
        contentChapterToStoreChapter(ch, treeCourseId, prevLessons),
      );

      if (chapters.length === 0) {
        try {
          const listed = await getChaptersListForCourseQueryFn(courseId);
          const pseudo = listed.map(listedChapterRowToContentChapter);
          chapters = pseudo.map((ch) =>
            contentChapterToStoreChapter(ch, treeCourseId, prevLessons),
          );
        } catch {
          // keep empty
        }
      }

      chapters = mergeOrphanLessonsFromCache(courseId, chapters, prevLessons);

      // Build CourseWithChapters using full course data + chapters from tree
      const courseWithChapters: CourseWithChapters = {
        ...course,
        chapters: chapters,
      } as CourseWithChapters;

      // Update chapters and lessons in their respective maps
      const chaptersMap: Record<string, Chapter> = {};
      const lessonsMap: Record<string, Lesson> = {};

      for (const chapter of chapters) {
        if (chapter._id) {
          chaptersMap[chapter._id] = chapter;
        }
        for (const lesson of chapter.lessons || []) {
          if (lesson._id) {
            lessonsMap[lesson._id] = lesson;
          }
        }
      }

      set({
        currentCourse: courseWithChapters,
        chaptersById: chaptersMap,
        lessonsById: lessonsMap,
        coursesById: { ...get().coursesById, [course._id]: course },
        error: null,
      });

      return courseWithChapters;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      if (showFullPageLoader) {
        set({ error: msg || "Failed to load course" });
      }
      return null;
    } finally {
      if (showFullPageLoader) {
        set({ loading: false });
      }
    }
  },

  createCourse: async (payload: FormData) => {
    set({ actionLoading: true, error: null });
    try {
      const course = unwrapLmsData<Course>(await createCourseMutationFn(payload));
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        allCourseIds: st.allCourseIds.includes(course._id) ? st.allCourseIds : [course._id, ...st.allCourseIds],
      }));
      void scheduleInvalidateLmsMediaForCourse(course._id);
      return course;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to create course" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateCourse: async (courseId: string, payload: UpdateCourseDto) => {
    set({ actionLoading: true, error: null });
    try {
      const { data: course } = await updateCourseMutationFn(courseId, payload);
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        currentCourse:
          st.currentCourse?._id === courseId
            ? {
                ...st.currentCourse,
                ...course,
                chapters:
                  Array.isArray(course.chapters) && course.chapters.length > 0
                    ? course.chapters
                    : st.currentCourse.chapters,
              }
            : st.currentCourse,
      }));
      void scheduleInvalidateLmsMediaForCourse(courseId);
      return course;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to update course" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteCourse: async (courseId: string) => {
    set({ actionLoading: true, error: null });
    try {
      await deleteCourseMutationFn(courseId);
      set((st) => {
        const rest = { ...st.coursesById };
        delete rest[courseId];
        return {
          coursesById: rest,
          allCourseIds: st.allCourseIds.filter((id) => id !== courseId),
          currentCourse: st.currentCourse?._id === courseId ? null : st.currentCourse,
        };
      });
      return true;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to delete course" });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // ==================== CHAPTERS ====================
  createChapter: async (courseId: string, payload: CreateChapterDto) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await createChapterMutationFn(courseId, payload);
      const chapter = unwrapLmsData<Chapter & { id?: string }>(res);
      const chapterId =
        chapter?._id != null
          ? String(chapter._id)
          : chapter?.id != null
            ? String(chapter.id)
            : "";

      if (!chapter || !chapterId) {
        set({ error: "Chapter created but server response was invalid." });
        return null;
      }

      const normalized = { ...chapter, _id: chapterId } as Chapter;

      set((st) => ({
        chaptersById: { ...st.chaptersById, [chapterId]: normalized },
      }));

      // Refresh course to get updated chapters
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId);

      return normalized;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to create chapter" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateChapter: async (courseId: string, chapterId: string, payload: UpdateChapterDto) => {
    set({ actionLoading: true, error: null });
    try {
      const { data: chapter } = await updateChapterMutationFn(courseId, chapterId, payload);
      set((st) => ({
        chaptersById: { ...st.chaptersById, [chapter._id]: chapter },
      }));

      // Update currentCourse if it has this chapter
      const currentCourse = get().currentCourse;
      if (currentCourse) {
        const updatedChapters = currentCourse.chapters.map(c =>
          c._id === chapterId ? { ...c, ...chapter } : c
        );
        set({ currentCourse: { ...currentCourse, chapters: updatedChapters } });
      }

      void scheduleInvalidateLmsMediaForCourse(courseId);
      return chapter;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to update chapter" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteChapter: async (courseId: string, chapterId: string) => {
    set({ actionLoading: true, error: null });
    try {
      await deleteChapterMutationFn(courseId, chapterId);

      // Update chapters map
      set((st) => {
        const rest = { ...st.chaptersById };
        delete rest[chapterId];
        return { chaptersById: rest };
      });

      // Refresh course to get updated chapters
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId);

      return true;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to delete chapter" });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  reorderChapters: async (courseId: string, data: ReorderChaptersDto) => {
    set({ actionLoading: true, error: null });
    try {
      await reorderChaptersMutationFn(courseId, data);

      // Refresh course to get updated order
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId);

      return true;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to reorder chapters" });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // ==================== LESSONS ====================
  createLesson: async (courseId: string, chapterId: string, payload: CreateLessonDto) => {
    set({ actionLoading: true, error: null });
    try {
      const { data: lesson } = await createLessonMutationFn(courseId, chapterId, payload);

      // Update lessons map
      set((st) => ({
        lessonsById: { ...st.lessonsById, [lesson._id]: lesson },
      }));

      // Refresh course to get updated lessons
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId, { chapterId });

      return lesson;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to create lesson" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateLesson: async (courseId: string, chapterId: string, lessonId: string, payload: UpdateLessonDto) => {
    set({ actionLoading: true, error: null });
    try {
      const { data: lesson } = await updateLessonMutationFn(courseId, chapterId, lessonId, payload);
      set((st) => ({
        lessonsById: { ...st.lessonsById, [lesson._id]: lesson },
      }));

      // Update currentCourse if it has this lesson
      const currentCourse = get().currentCourse;
      if (currentCourse) {
        const updatedChapters = currentCourse.chapters.map(ch => {
          if (ch._id !== chapterId) return ch;
          const updatedLessons = (ch.lessons || []).map(l =>
            l._id === lessonId ? { ...l, ...lesson } : l
          );
          return { ...ch, lessons: updatedLessons };
        });
        set({ currentCourse: { ...currentCourse, chapters: updatedChapters } });
      }

      void scheduleInvalidateLmsMediaForCourse(courseId, { chapterId, lessonId });
      return lesson;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to update lesson" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteLesson: async (courseId: string, chapterId: string, lessonId: string) => {
    set({ actionLoading: true, error: null });
    try {
      await deleteLessonMutationFn(courseId, chapterId, lessonId);

      // Update lessons map
      set((st) => {
        const rest = { ...st.lessonsById };
        delete rest[lessonId];
        return { lessonsById: rest };
      });

      // Refresh course to get updated lessons
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId, { chapterId, lessonId });

      return true;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to delete lesson" });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  reorderLessons: async (courseId: string, chapterId: string, data: ReorderLessonsDto) => {
    set({ actionLoading: true, error: null });
    try {
      await reorderLessonsMutationFn(courseId, chapterId, data);

      // Refresh course to get updated order
      await get().fetchCourseById(courseId);
      void scheduleInvalidateLmsMediaForCourse(courseId, { chapterId });

      return true;
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to reorder lessons" });
      return false;
    } finally {
      set({ actionLoading: false });
    }
  },

  // ==================== CONTENT UPLOAD ====================
  uploadContent: async (courseId: string, file: File, contentType: "lesson" | "chapter" | "course", contentId: string) => {
    set({ actionLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("contentType", contentType);
      formData.append("contentId", contentId);

      const result = await uploadContentFileMutationFn(formData);
      void scheduleInvalidateLmsMediaForCourse(courseId, {
        chapterId: contentType === "chapter" ? contentId : undefined,
        lessonId: contentType === "lesson" ? contentId : undefined,
      });
      return { fileUrl: result.data.fileUrl, objectKey: result.data.assetId };
    } catch (e: unknown) {
      const msg = getErrorMessageFromUnknown(e);
      set({ error: msg || "Failed to upload file" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },
}));
