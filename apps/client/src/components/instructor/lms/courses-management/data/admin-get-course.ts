export async function adminGetCourse(id: string) {
  // Demo-only: return a fake course object based on the id, no DB
  const chapterId = `${id}-chapter-1`;
  return {
    id,
    title: "Demo Course " + id,
    description: JSON.stringify({ type: "doc", content: [] }),
    fileKey: null as string | null,
    price: 0,
    duration: 2,
    level: "Beginner" as const,
    status: "Draft" as const,
    slug: "demo-course-" + id,
    smallDescription: "This is a demo course used in UI-only mode.",
    category: "Development" as const,
    chapter: [
      {
        id: chapterId,
        title: "Introduction",
        position: 1,
        lessons: [
          {
            id: `${chapterId}-lesson-1`,
            title: "Welcome to the course",
            position: 1,
          },
          {
            id: `${chapterId}-lesson-2`,
            title: "How this course works",
            position: 2,
          },
        ],
      },
    ],
  };
}

export type AdminCourseSingularType = Awaited<ReturnType<typeof adminGetCourse>>;
