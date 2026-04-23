import { useQuery } from "@tanstack/react-query";
import { getInstructorCoursesQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Course } from "@/types/api/lms/courses.type";

export const useInstructorCourses = () => {
  return useQuery<Course[], Error>({
    queryKey: ["instructor-courses"],
    queryFn: async () => {
      const response = await getInstructorCoursesQueryFn();
      return response.items || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
