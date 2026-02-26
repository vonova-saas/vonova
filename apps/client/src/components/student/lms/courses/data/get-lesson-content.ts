
export async function getLessonContent(lessonId: string) {
  // Demo-only: fake lesson content, no DB or enrollment checks
  const courseId = "demo-course-for-" + lessonId;
  return {
    id: lessonId,
    title: "Demo Lesson Content",
    description: "This is demo lesson content rendered without a backend.",
    thumbnailKey: null,
    videoKey: null,
    position: 1,
    lessonProgress: [
      {
        completed: false,
        lessonId,
        userId: "demo-user-id",
      },
    ],
    Chapter: {
      courseId,
      Course: {
        slug: "demo-course-slug",
      },
    },
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
