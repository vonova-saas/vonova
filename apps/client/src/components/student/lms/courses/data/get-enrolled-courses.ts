"use client";

import { Course } from "@/types/api/lms/courses.type";
import { getMyEnrollmentsQueryFn } from "@/services/student/lms/courses/courses.api";

export async function getEnrolledCourses(): Promise<EnrolledCourseType[]> {
  try {
    const rows = await getMyEnrollmentsQueryFn();
    return rows
      .filter(
        (r): r is (typeof r & { course: Course }) =>
          Boolean(r.course?._id) &&
          (r.status === "ACTIVE" || r.status === "COMPLETED"),
      )
      .map((r) => ({
        Course: r.course,
        progress: r.progress ?? 0,
      }));
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return [];
  }
}

export type EnrolledCourseType = {
  Course: Course;
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
};
