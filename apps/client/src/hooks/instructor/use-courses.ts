import { useQuery } from "@tanstack/react-query";
import { getInstructorCoursesQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Course } from "@/types/api/lms/courses.type";
import { S3_PRESIGNED_QUERY_STALE_MS } from "@/lib/lms/presigned-url";

export const useInstructorCourses = () => {
  return useQuery<Course[], Error>({
    queryKey: ["instructor-courses"],
    queryFn: async () => {
      const response = await getInstructorCoursesQueryFn();
      return response.items || [];
    },
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000,
  });
};
