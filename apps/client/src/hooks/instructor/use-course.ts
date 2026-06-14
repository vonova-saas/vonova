import { useQuery } from "@tanstack/react-query";
import { getCourseContentTreeQueryFn } from "@/services/student/lms/courses/real-courses.api";
import { getInstructorCourseByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Chapter, Course } from "@/types/api/lms/courses.type";
import { S3_PRESIGNED_QUERY_STALE_MS } from "@/lib/lms/presigned-url";

const INSTRUCTOR_COURSE_GC_MS = S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000;

export const useInstructorCourse = (courseId: string) => {
  return useQuery<Course, Error>({
    queryKey: ["instructor-course", courseId],
    queryFn: async () => {
      // Fetch both course details and content tree in parallel
      const [course, tree] = await Promise.all([
        getInstructorCourseByIdQueryFn(courseId),
        getCourseContentTreeQueryFn(courseId).catch(() => ({
          courseId,
          chapters: [],
        })),
      ]);

      // Transform ContentChapter[] to Chapter[] by adding missing fields
      const chapters: Chapter[] = (tree.chapters || []).map((contentChapter: any) => ({
        ...contentChapter,
        courseId: course._id,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        lessons: contentChapter.lessons?.map((contentLesson: any) => ({
          ...contentLesson,
          _id: contentLesson._id,
          courseId: course._id,
          chapterId: contentChapter._id,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        })),
      }));

      // Merge chapters into course data
      const courseWithChapters: Course & { chapters: Chapter[] } = {
        ...course,
        chapters,
      };
      return courseWithChapters;
    },
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: INSTRUCTOR_COURSE_GC_MS,
    enabled: !!courseId,
  });
};
