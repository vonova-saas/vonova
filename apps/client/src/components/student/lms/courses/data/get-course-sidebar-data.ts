export async function getCourseSidebarData(slug: string) {

  // Demo-only: fake sidebar course data, ignores real DB/enrollment
  const courseId = "sidebar-course-" + slug;
  const course = {
    id: courseId,
    title: "Demo Sidebar Course",
    fileKey: "demo-sidebar-thumb",
    duration: 3,
    level: "Beginner",
    category: "Development",
    slug,
    chapter: [
      {
        id: courseId + "-chapter-1",
        title: "Getting Started",
        position: 1,
        lessons: [
          {
            id: courseId + "-lesson-1",
            title: "Welcome",
            position: 1,
            description: "Introduction lesson in demo mode.",
            lessonProgress: [
              {
                id: "progress-1",
                lessonId: courseId + "-lesson-1",
                completed: false,
                userId: "demo-user-id",
              },
            ],
          },
          {
            id: courseId + "-lesson-2",
            title: "Setup",
            position: 1,
            description: "Codeing Setup lesson in demo mode.",
            lessonProgress: [
              {
                id: "progress-2",
                lessonId: courseId + "-lesson-2",
                completed: false,
                userId: "demo-user-id",
              },
            ],
          },
        ],
      },
    ],
  };

  return { course };
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
