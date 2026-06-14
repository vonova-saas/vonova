import { useQuery } from "@tanstack/react-query";
import { getLessonByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Lesson } from "@/types/api/lms/courses.type";
import { S3_PRESIGNED_QUERY_STALE_MS } from "@/lib/lms/presigned-url";

const LESSON_QUERY_GC_MS = S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000;

export const useLesson = (courseId: string, chapterId: string, lessonId: string) => {
  return useQuery<Lesson, Error>({
    queryKey: ["lesson", courseId, chapterId, lessonId],
    queryFn: async () => {
      const response = await getLessonByIdQueryFn(courseId, chapterId, lessonId);
      return response.data;
    },
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: LESSON_QUERY_GC_MS,
    enabled: !!courseId && !!chapterId && !!lessonId,
  });
};
