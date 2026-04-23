/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import {
  getAllCoursesQueryFn,
  getCourseByIdQueryFn,
  getCourseBySlugQueryFn,
  enrollCourseMutationFn,
  getEnrollmentStatusQueryFn,
  getCourseContentTreeQueryFn,
} from "@/services/student/lms/courses/courses.api";
import type {
  Course,
  Enrollment,
  CourseContentTree,
} from "@/types/api/lms/courses.type";

type StudentCoursesStore = {
  // Data
  coursesById: Record<string, Course>;
  allCourseIds: string[];
  currentCourse: Course | null;
  courseContent: CourseContentTree | null;
  enrollmentsByCourseId: Record<string, Enrollment>;
  
  // Loading states
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  
  // Actions - Browse Courses
  fetchAllCourses: (params?: { category?: string; difficulty?: string; status?: string }) => Promise<void>;
  fetchCourseById: (courseId: string) => Promise<Course | null>;
  fetchCourseBySlug: (slug: string) => Promise<Course | null>;
  fetchCourseContent: (courseId: string) => Promise<CourseContentTree | null>;
  
  // Actions - Enrollment
  enrollInCourse: (courseId: string) => Promise<Enrollment | null>;
  checkEnrollmentStatus: (courseId: string) => Promise<Enrollment | null>;
  isEnrolled: (courseId: string) => boolean;
  
  // Helpers
  clearError: () => void;
  setCurrentCourse: (course: Course | null) => void;
};

export const useStudentCoursesStore = create<StudentCoursesStore>((set, get) => ({
  // Initial state
  coursesById: {},
  allCourseIds: [],
  currentCourse: null,
  courseContent: null,
  enrollmentsByCourseId: {},
  loading: false,
  actionLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  setCurrentCourse: (course) => set({ currentCourse: course }),

  // ==================== BROWSE COURSES ====================
  fetchAllCourses: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await getAllCoursesQueryFn(params);
      const courses = response.items || [];
      
      const map: Record<string, Course> = {};
      const ids: string[] = [];
      
      for (const course of courses) {
        map[course._id] = course;
        ids.push(course._id);
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
      const course = await getCourseByIdQueryFn(courseId);
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        currentCourse: course,
      }));
      return course;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load course" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchCourseBySlug: async (slug: string) => {
    set({ loading: true, error: null });
    try {
      const course = await getCourseBySlugQueryFn(slug);
      set((st) => ({
        coursesById: { ...st.coursesById, [course._id]: course },
        currentCourse: course,
      }));
      return course;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load course" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchCourseContent: async (courseId: string) => {
    set({ loading: true, error: null });
    try {
      const content = await getCourseContentTreeQueryFn(courseId);
      set({ courseContent: content });
      return content;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to load course content" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ==================== ENROLLMENT ====================
  enrollInCourse: async (courseId: string) => {
    set({ actionLoading: true, error: null });
    try {
      const enrollment = await enrollCourseMutationFn(courseId);
      set((st) => ({
        enrollmentsByCourseId: { ...st.enrollmentsByCourseId, [courseId]: enrollment },
      }));
      return enrollment;
    } catch (e: unknown) {
      const msg = (e && typeof e === "object" && "message" in e) ? String((e as { message?: string }).message) : undefined;
      set({ error: msg || "Failed to enroll in course" });
      return null;
    } finally {
      set({ actionLoading: false });
    }
  },

  checkEnrollmentStatus: async (courseId: string) => {
    set({ loading: true, error: null });
    try {
      const enrollment = await getEnrollmentStatusQueryFn(courseId);
      set((st) => ({
        enrollmentsByCourseId: { ...st.enrollmentsByCourseId, [courseId]: enrollment },
      }));
      return enrollment;
    } catch (e: unknown) {
      // Don't set error - just means not enrolled
      return null;
    } finally {
      set({ loading: false });
    }
  },

  isEnrolled: (courseId: string) => {
    const enrollment = get().enrollmentsByCourseId[courseId];
    return enrollment?.status === "ACTIVE" || enrollment?.status === "COMPLETED";
  },
}));
