import { getInstructorCoursesQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Course } from "@/types/api/lms/courses.type";

export async function adminGetCourses() {
  try {
    const response = await getInstructorCoursesQueryFn();
    return response.items || [];
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    return [];
  }
}

export type AdminCourseType = Course;

