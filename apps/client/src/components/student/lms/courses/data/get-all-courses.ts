import { getAllCoursesQueryFn } from "@/services/student/lms/courses/courses.api";
import { Course } from "@/types/api/lms/courses.type";

export async function getAllCourses() {
  try {
    const response = await getAllCoursesQueryFn({ status: "PUBLISHED" });
    return response.items || [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export type PublicCourseType = Course;
