import { create } from "zustand";
import {
  getInstructorCoursesQueryFn,
  getInstructorCourseByIdQueryFn,
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
} from "@/services/student/lms/courses/courses.api";
import type {
  Course,
  Chapter,
  Lesson,
  ContentChapter,
  ContentLesson,
  CreateCourseDto,
  UpdateCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderChaptersDto,
  ReorderLessonsDto,
} from "@/types/api/lms/courses.type";

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
  createCourse: (payload: CreateCourseDto) => Promise<Course | null>;
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

  // ==================== COURSES ====================
  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getInstructorCoursesQueryFn();
      const list = Array.isArray(res) ? res : (res as any)?.courses || [];
      const map: Record<string, Course> = {};
      const ids: string[] = [];
      for (const c of list) {
        map[c._id] = c;
        ids.push(c._id);
      }
      set({ coursesById: map, allCourseIds: ids });
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load courses" });
    } finally {
      set({ loading: false });
    }
  },

  fetchCourseById: async (courseId: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch both course details and content tree in parallel
      const [course, tree] = await Promise.all([
        getInstructorCourseByIdQueryFn(courseId),
        getCourseContentTreeQueryFn(courseId),
      ]);
      
      // Convert ContentChapter[] to Chapter[] with proper structure
      const chapters: Chapter[] = (tree.chapters || []).map((ch: ContentChapter) => ({
        _id: ch._id,
        courseId: tree.courseId,
        title: ch.title,
        index: ch.index,
        lessons: (ch.lessons || []).map((l: ContentLesson) => ({
          _id: l._id,
          courseId: tree.courseId,
          chapterId: ch._id,
          title: l.title,
          index: l.index,
          content: l.content,
          durationMinutes: l.duration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Lesson)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Chapter));
      
      // Build CourseWithChapters using full course data + chapters from tree
      const courseWithChapters: CourseWithChapters = {
        ...course,
        chapters: chapters,
      } as CourseWithChapters;
      
      // Update chapters and lessons in their respective maps
      const chaptersMap: Record<string, Chapter> = {};
      const lessonsMap: Record<string, Lesson> = {};
      
      for (const chapter of chapters) {
        chaptersMap[chapter._id] = chapter;
        for (const lesson of chapter.lessons || []) {
          lessonsMap[lesson._id] = lesson;
        }
      }
      
      set({ 
        currentCourse: courseWithChapters,
        chaptersById: chaptersMap,
        lessonsById: lessonsMap,
        coursesById: { ...get().coursesById, [course._id]: course }
      });
      
      return courseWithChapters;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load course" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createCourse: async (payload: CreateCourseDto) => {
    set({ actionLoading: true, error: null });
    try {
      const course = await createCourseMutationFn(payload);
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        allCourseIds: st.allCourseIds.includes(course._id) ? st.allCourseIds : [course._id, ...st.allCourseIds],
      }));
      return course;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to create course" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateCourse: async (courseId: string, payload: UpdateCourseDto) => {
    set({ actionLoading: true, error: null });
    try {
      const course = await updateCourseMutationFn(courseId, payload);
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        currentCourse: st.currentCourse?._id === courseId 
          ? { ...st.currentCourse, ...course } 
          : st.currentCourse,
      }));
      return course;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      const chapter = await createChapterMutationFn(courseId, payload);
      
      // Update chapters map
      set((st) => ({
        chaptersById: { ...st.chaptersById, [chapter._id]: chapter },
      }));
      
      // Refresh course to get updated chapters
      await get().fetchCourseById(courseId);
      
      return chapter;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to create chapter" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateChapter: async (courseId: string, chapterId: string, payload: UpdateChapterDto) => {
    set({ actionLoading: true, error: null });
    try {
      const chapter = await updateChapterMutationFn(courseId, chapterId, payload);
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
      
      return chapter;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      
      return true;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      
      return true;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      const lesson = await createLessonMutationFn(courseId, chapterId, payload);
      
      // Update lessons map
      set((st) => ({
        lessonsById: { ...st.lessonsById, [lesson._id]: lesson },
      }));
      
      // Refresh course to get updated lessons
      await get().fetchCourseById(courseId);
      
      return lesson;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to create lesson" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateLesson: async (courseId: string, chapterId: string, lessonId: string, payload: UpdateLessonDto) => {
    set({ actionLoading: true, error: null });
    try {
      const lesson = await updateLessonMutationFn(courseId, chapterId, lessonId, payload);
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
      
      return lesson;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      
      return true;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      
      return true;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
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
      const result = await uploadContentFileMutationFn(courseId, file, contentType, contentId);
      return { fileUrl: result.fileUrl, objectKey: result.objectKey };
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to upload file" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },
}));
