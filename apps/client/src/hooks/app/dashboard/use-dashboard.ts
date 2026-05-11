'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getStudentDashboardFn,
  getStudentActivityFn,
  getInstructorDashboardFn,
  getInstructorCoursePerformanceFn,
  getInstructorRevenueFn,
} from '@/services/app/dashboard/dashboard.api';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  student: () => [...dashboardKeys.all, 'student'] as const,
  studentActivity: (days: number) => [...dashboardKeys.student(), 'activity', days] as const,
  instructor: () => [...dashboardKeys.all, 'instructor'] as const,
  instructorPerformance: (courseId?: string) => [...dashboardKeys.instructor(), 'performance', courseId || 'all'] as const,
  instructorRevenue: (months: number) => [...dashboardKeys.instructor(), 'revenue', months] as const,
};

// Student Dashboard
export const useStudentDashboard = () => {
  return useQuery({
    queryKey: dashboardKeys.student(),
    queryFn: getStudentDashboardFn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStudentActivity = (days = 30) => {
  return useQuery({
    queryKey: dashboardKeys.studentActivity(days),
    queryFn: () => getStudentActivityFn(days),
    staleTime: 5 * 60 * 1000,
  });
};

// Instructor Dashboard
export const useInstructorDashboard = () => {
  return useQuery({
    queryKey: dashboardKeys.instructor(),
    queryFn: getInstructorDashboardFn,
    staleTime: 2 * 60 * 1000,
  });
};

export const useInstructorCoursePerformance = (courseId?: string) => {
  return useQuery({
    queryKey: dashboardKeys.instructorPerformance(courseId),
    queryFn: () => getInstructorCoursePerformanceFn(courseId),
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInstructorRevenue = (months = 12) => {
  return useQuery({
    queryKey: dashboardKeys.instructorRevenue(months),
    queryFn: () => getInstructorRevenueFn(months),
    staleTime: 10 * 60 * 1000, // 10 minutes - revenue doesn't change often
  });
};
