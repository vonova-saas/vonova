"use client";

import { getAllCoursesQueryFn } from "@/services/student/lms/courses/courses.api";
import { getMockCourses } from "@/lib/mock-data/courses/storage";
import { Course } from "@/types/api/lms/courses.type";

export async function getAllCourses(): Promise<Course[]> {
  try {
    // Debug: Log all courses in storage
    const allStorageCourses = getMockCourses();
    console.log("[Debug] All courses in storage:", allStorageCourses.length, allStorageCourses.map(c => ({ id: c._id, title: c.title, status: c.status })));

    const response = await getAllCoursesQueryFn({ status: "PUBLISHED" });
    console.log("[Debug] Published courses response:", response.items.length, response.items.map(c => ({ id: c._id, title: c.title, status: c.status })));
    return response.items || [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export type PublicCourseType = Course;
