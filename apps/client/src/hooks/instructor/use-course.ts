import { useQuery } from "@tanstack/react-query";
import { getCourseContentTreeQueryFn } from "@/services/student/lms/courses/real-courses.api";
import { getInstructorCourseByIdQueryFn } from "@/services/instructor/course-managment/courses.api";
import { Chapter, Course } from "@/types/api/lms/courses.type";

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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!courseId,
  });
};
