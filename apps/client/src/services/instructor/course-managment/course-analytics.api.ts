import API from "@/services/axios-client";
import { peelLmsResponseLayers } from "@/lib/api/unwrap-lms-body";
import type {
  CourseAnalyticsOverview,
  CourseCommunityAnalytics,
  CourseEngagementAnalytics,
  CourseQuizAnalytics,
  CourseStudentsAnalyticsPage,
} from "@/types/api/instructor/lms/course-analytics.type";

const base = (courseId: string) =>
  `/api/v1/lms/instructor/courses/${courseId}/analytics`;

function unwrap<T>(body: unknown): T {
  return peelLmsResponseLayers(body) as T;
}

export async function fetchCourseAnalyticsOverview(
  courseId: string,
): Promise<CourseAnalyticsOverview> {
  const res = await API.get(`${base(courseId)}/overview`);
  return unwrap<CourseAnalyticsOverview>(res.data);
}

export async function fetchCourseAnalyticsStudents(
  courseId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: "progress" | "quiz" | "lastActive" | "joined";
    filter?: "inactive" | "completed" | "lowPerformers";
  },
): Promise<CourseStudentsAnalyticsPage> {
  const res = await API.get(`${base(courseId)}/students`, { params });
  return unwrap<CourseStudentsAnalyticsPage>(res.data);
}

export async function fetchCourseAnalyticsQuizzes(
  courseId: string,
): Promise<CourseQuizAnalytics> {
  const res = await API.get(`${base(courseId)}/quizzes`);
  return unwrap<CourseQuizAnalytics>(res.data);
}

export async function fetchCourseAnalyticsEngagement(
  courseId: string,
): Promise<CourseEngagementAnalytics> {
  const res = await API.get(`${base(courseId)}/engagement`);
  return unwrap<CourseEngagementAnalytics>(res.data);
}

export async function fetchCourseAnalyticsCommunity(
  courseId: string,
): Promise<CourseCommunityAnalytics> {
  const res = await API.get(`${base(courseId)}/community`);
  return unwrap<CourseCommunityAnalytics>(res.data);
}

export async function downloadCourseAnalyticsCsv(courseId: string): Promise<void> {
  const res = await API.get(`${base(courseId)}/export`, {
    params: { format: "csv" },
    responseType: "blob",
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `course-${courseId}-students.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
