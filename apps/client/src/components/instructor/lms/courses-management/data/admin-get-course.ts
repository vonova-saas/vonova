import { getInstructorCourseByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Course } from "@/types/api/lms/courses.type";

export async function adminGetCourse(id: string): Promise<Course> {
  try {
    const course = await getInstructorCourseByIdQueryFn(id);
    return course;
  } catch (error) {
    console.error("Error fetching course:", error);
    throw new Error("Failed to fetch course");
  }
}

export type AdminCourseSingularType = Course;
