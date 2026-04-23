import { useQuery } from "@tanstack/react-query";
import { getCourseContentTreeQueryFn } from "@/services/student/lms/courses/courses.api";
import { Course } from "@/types/api/lms/courses.type";

export const useInstructorCourse = (courseId: string) => {
  return useQuery<Course, Error>({
    queryKey: ["instructor-course", courseId],
    queryFn: async () => {
      // Use content tree endpoint which returns course with chapters
      const response = await getCourseContentTreeQueryFn(courseId);
      // Merge chapters into course data
      const courseWithChapters = {
        ...response.course,
        chapters: response.chapters || [],
      };
      return courseWithChapters;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!courseId,
  });
};
