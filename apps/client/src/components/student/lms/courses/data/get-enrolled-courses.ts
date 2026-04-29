"use client";

import { Course } from "@/types/api/lms/courses.type";
import { getAllCoursesQueryFn } from "@/services/student/lms/courses/courses.api";
import { getEnrollmentStatusQueryFn } from "@/services/student/lms/courses/courses.api";

export async function getEnrolledCourses(): Promise<EnrolledCourseType[]> {
  try {
    // Get all published courses
    const coursesResponse = await getAllCoursesQueryFn({ status: "PUBLISHED" });
    const courses = coursesResponse.items || [];

    // Check enrollment status for each course
    const enrolledCourses: EnrolledCourseType[] = [];

    for (const course of courses) {
      try {
        const enrollment = await getEnrollmentStatusQueryFn(course._id);
        if (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED") {
          enrolledCourses.push({
            Course: course,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons,
            totalLessons: enrollment.totalLessons,
          });
        }
      } catch {
        // User is not enrolled in this course, skip it
        continue;
      }
    }

    return enrolledCourses;
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
