import { useQuery } from "@tanstack/react-query";
import { getLessonByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Lesson } from "@/types/api/lms/courses.type";

export const useLesson = (courseId: string, chapterId: string, lessonId: string) => {
  return useQuery<Lesson, Error>({
    queryKey: ["lesson", courseId, chapterId, lessonId],
    queryFn: async () => {
      const lesson = await getLessonByIdQueryFn(courseId, chapterId, lessonId);
      return lesson;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!courseId && !!chapterId && !!lessonId,
  });
};
