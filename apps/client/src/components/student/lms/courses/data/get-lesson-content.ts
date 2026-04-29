import { getMockLessonById, getMockEnrollment } from "@/lib/mock-data/courses/storage";

export async function getLessonContent(lessonId: string, userId?: string) {
  // Get real lesson from mock storage
  const lesson = getMockLessonById(lessonId);

  console.log("[getLessonContent] Lesson lookup:", lessonId, lesson ? "Found" : "Not found");
  if (lesson) {
    console.log("[getLessonContent] Lesson videoKey:", lesson.videoKey);
  }

  if (!lesson) {
    // Fallback to demo data if lesson not found
    return {
      id: lessonId,
      title: "Demo Lesson Content",
      description: "This is demo lesson content rendered without a backend.",
      thumbnailKey: null,
      videoKey: null,
      position: 1,
      lessonProgress: [],
      Chapter: {
        courseId: "demo-course",
        Course: {
          slug: "demo-course-slug",
        },
      },
    };
  }

  // Check if user has completed this lesson (simplified for mock data)
  const enrollment = userId ? getMockEnrollment(lesson.courseId, userId) : undefined;
  const isCompleted = enrollment?.status === "COMPLETED" || false;
  const lessonProgress = isCompleted
    ? [{ completed: true, lessonId, userId: userId || "anonymous" }]
    : [];

  return {
    id: lesson._id,
    title: lesson.title,
    description: lesson.content || "",
    thumbnailKey: lesson.thumbnailKey || null,
    videoKey: lesson.videoKey || null,
    position: lesson.index,
    lessonProgress,
    Chapter: {
      courseId: lesson.courseId,
      Course: {
        slug: "course-slug", // Could be fetched from course if needed
      },
    },
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
