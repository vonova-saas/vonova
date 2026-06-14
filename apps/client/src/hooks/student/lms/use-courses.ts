'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllCoursesQueryFn,
  getCourseBySlugQueryFn,
  getCourseByIdQueryFn,
  enrollCourseMutationFn,
  getEnrollmentStatusQueryFn,
  getCourseContentTreeQueryFn,
  getLessonAccessQueryFn,
  getLessonContentQueryFn,
  getCourseProgressQueryFn,
  markLessonCompleteMutationFn,
  createReviewMutationFn,
  getCourseReviewsQueryFn,
  getMyReviewQueryFn,
} from '@/services/student/lms/courses/real-courses.api';
import type { CreateReviewDto, StudentCourseProgress } from '@/types/api/lms/courses.type';
import { getCourseSidebarData } from '@/components/student/lms/courses/data/get-course-sidebar-data';
import { S3_PRESIGNED_QUERY_STALE_MS } from '@/lib/lms/presigned-url';

const SIGNED_MEDIA_GC_MS = S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000;

// Query Keys
export const coursesKeys = {
  all: ['courses'] as const,
  lists: () => [...coursesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...coursesKeys.lists(), filters] as const,
  details: () => [...coursesKeys.all, 'detail'] as const,
  detail: (slug: string) => [...coursesKeys.details(), slug] as const,
  detailById: (courseId: string) => [...coursesKeys.details(), courseId] as const,
  enrollment: (courseId: string) => [...coursesKeys.all, 'enrollment', courseId] as const,
  contentTree: (courseId: string) => [...coursesKeys.all, 'content-tree', courseId] as const,
  lessonAccess: (courseId: string, lessonId: string) => [...coursesKeys.all, 'lesson-access', courseId, lessonId] as const,
  lessonContent: (courseId: string, lessonId: string) => [...coursesKeys.all, 'lesson-content', courseId, lessonId] as const,
  progress: (courseId: string) => [...coursesKeys.all, 'progress', courseId] as const,
  sidebar: (slug: string, cid?: string | null) =>
    [...coursesKeys.all, "sidebar", slug, cid ?? ""] as const,
  reviews: (courseId: string) => [...coursesKeys.all, 'reviews', courseId] as const,
};

export const useCourseSidebarData = (slug: string, cid?: string | null) => {
  return useQuery({
    queryKey: coursesKeys.sidebar(slug, cid),
    queryFn: () => getCourseSidebarData(slug, cid),
    enabled: !!slug,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

// Browse Courses
export const useAllCourses = (params?: { page?: number; limit?: number; search?: string; difficulty?: string }) => {
  return useQuery({
    queryKey: coursesKeys.list(params || {}),
    queryFn: () => getAllCoursesQueryFn(params),
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

export const useCourseBySlug = (slug: string) => {
  return useQuery({
    queryKey: coursesKeys.detail(slug),
    queryFn: () => getCourseBySlugQueryFn(slug),
    enabled: !!slug,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

export const useCourseById = (courseId: string) => {
  return useQuery({
    queryKey: coursesKeys.detailById(courseId),
    queryFn: () => getCourseByIdQueryFn(courseId),
    enabled: !!courseId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

// Enrollment
export const useEnrollmentStatus = (courseId: string) => {
  return useQuery({
    queryKey: coursesKeys.enrollment(courseId),
    queryFn: () => getEnrollmentStatusQueryFn(courseId),
    enabled: !!courseId,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => 
      enrollCourseMutationFn(courseId, couponCode),
    onSuccess: (_, variables) => {
      toast.success('Successfully enrolled in course!');
      queryClient.invalidateQueries({ queryKey: coursesKeys.enrollment(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: coursesKeys.progress(variables.courseId) });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'courses' &&
          q.queryKey[1] === 'sidebar',
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to enroll in course');
    },
  });
};

// Content
export const useCourseContentTree = (courseId: string) => {
  return useQuery({
    queryKey: coursesKeys.contentTree(courseId),
    queryFn: () => getCourseContentTreeQueryFn(courseId),
    enabled: !!courseId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

export const useLessonAccess = (courseId: string, lessonId: string) => {
  return useQuery({
    queryKey: coursesKeys.lessonAccess(courseId, lessonId),
    queryFn: () => getLessonAccessQueryFn(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
};

export const useLessonContent = (courseId: string, lessonId: string) => {
  return useQuery({
    queryKey: coursesKeys.lessonContent(courseId, lessonId),
    queryFn: () => getLessonContentQueryFn(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: SIGNED_MEDIA_GC_MS,
  });
};

// Progress
export const useCourseProgress = (courseId: string) => {
  return useQuery<StudentCourseProgress>({
    queryKey: coursesKeys.progress(courseId),
    queryFn: () => getCourseProgressQueryFn(courseId),
    enabled: !!courseId,
  });
};

export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      courseId, 
      lessonId, 
      data 
    }: { 
      courseId: string; 
      lessonId: string; 
      data: { completed: boolean; timeSpentSec?: number } 
    }) => markLessonCompleteMutationFn(courseId, lessonId, data),
    onSuccess: (_, variables) => {
      toast.success('Progress saved!');
      const { courseId, lessonId } = variables;
      queryClient.invalidateQueries({ queryKey: coursesKeys.progress(courseId) });
      queryClient.invalidateQueries({ queryKey: coursesKeys.contentTree(courseId) });
      queryClient.invalidateQueries({
        queryKey: coursesKeys.lessonContent(courseId, lessonId),
      });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'courses' &&
          q.queryKey[1] === 'sidebar',
      });
      queryClient.invalidateQueries({ queryKey: ['course-details'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save progress');
    },
  });
};

// Reviews
export const useCourseReviews = (courseId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...coursesKeys.reviews(courseId), params],
    queryFn: () => getCourseReviewsQueryFn(courseId, params),
    enabled: !!courseId,
  });
};

export const useMyReview = (courseId: string) => {
  return useQuery({
    queryKey: [...coursesKeys.reviews(courseId), 'my-review'],
    queryFn: () => getMyReviewQueryFn(courseId),
    enabled: !!courseId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CreateReviewDto }) => 
      createReviewMutationFn(courseId, data),
    onSuccess: (_, variables) => {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: coursesKeys.reviews(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: [...coursesKeys.reviews(variables.courseId), 'my-review'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    },
  });
};
