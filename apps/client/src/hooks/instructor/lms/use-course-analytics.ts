"use client";

import { useQuery } from "@tanstack/react-query";
import {
  downloadCourseAnalyticsCsv,
  fetchCourseAnalyticsCommunity,
  fetchCourseAnalyticsEngagement,
  fetchCourseAnalyticsOverview,
  fetchCourseAnalyticsQuizzes,
  fetchCourseAnalyticsStudents,
} from "@/services/instructor/course-managment/course-analytics.api";

export function useCourseAnalyticsOverview(courseId: string, enabled = true) {
  return useQuery({
    queryKey: ["instructor", "course-analytics", courseId, "overview"],
    queryFn: () => fetchCourseAnalyticsOverview(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}

export function useCourseAnalyticsStudents(
  courseId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: "progress" | "quiz" | "lastActive" | "joined";
    filter?: "inactive" | "completed" | "lowPerformers";
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ["instructor", "course-analytics", courseId, "students", params],
    queryFn: () => fetchCourseAnalyticsStudents(courseId, params),
    enabled: Boolean(courseId) && enabled,
    staleTime: 30_000,
  });
}

export function useCourseAnalyticsQuizzes(courseId: string, enabled = true) {
  return useQuery({
    queryKey: ["instructor", "course-analytics", courseId, "quizzes"],
    queryFn: () => fetchCourseAnalyticsQuizzes(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}

export function useCourseAnalyticsEngagement(courseId: string, enabled = true) {
  return useQuery({
    queryKey: ["instructor", "course-analytics", courseId, "engagement"],
    queryFn: () => fetchCourseAnalyticsEngagement(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}

export function useCourseAnalyticsCommunity(courseId: string, enabled = true) {
  return useQuery({
    queryKey: ["instructor", "course-analytics", courseId, "community"],
    queryFn: () => fetchCourseAnalyticsCommunity(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}

export { downloadCourseAnalyticsCsv };
