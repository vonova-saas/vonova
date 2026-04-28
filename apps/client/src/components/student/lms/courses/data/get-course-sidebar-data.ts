"use client";

import { getMockCourses, getMockChaptersByCourse, getMockLessonsByChapter } from "@/lib/mock-data/courses/storage";

export async function getCourseSidebarData(slug: string) {
  // Find course by slug from mock storage
  const courses = getMockCourses();
  const course = courses.find(c => c.slug === slug);

  if (!course) {
    // Fallback to demo data if course not found
    const courseId = "sidebar-course-" + slug;
    return {
      course: {
        id: courseId,
        title: "Demo Sidebar Course",
        fileKey: "demo-sidebar-thumb",
        duration: 3,
        level: "Beginner",
        category: "Development",
        slug,
        chapter: [],
      }
    };
  }

  // Get real chapters and lessons
  const chapters = getMockChaptersByCourse(course._id);
  const chapterData = chapters.map((chapter, chapterIndex) => {
    const lessons = getMockLessonsByChapter(chapter._id);
    return {
      id: chapter._id,
      title: chapter.title,
      position: chapter.index || chapterIndex + 1,
      lessons: lessons.map((lesson, lessonIndex) => ({
        id: lesson._id,
        title: lesson.title,
        position: lesson.index || lessonIndex + 1,
        description: lesson.content || "",
        lessonProgress: [], // Will be populated based on user progress
      })),
    };
  });

  return {
    course: {
      id: course._id,
      title: course.title,
      fileKey: course.thumbnailUrl || "",
      duration: 0, // Could calculate from lessons
      level: course.difficulty || "BEGINNER",
      category: course.tags?.[0] || "General",
      slug: course.slug,
      chapter: chapterData,
    }
  };
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
