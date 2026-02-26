export async function getIndividualCourse(slug: string) {
  // Demo-only: return a fake course built from the slug
  const id = "demo-course-" + slug;
  return {
    id,
    title: "Demo Course for " + slug,
    description: JSON.stringify({ type: "doc", content: [] }),
    fileKey: "demo-course-thumb",
    price: 0,
    duration: 3,
    level: "Beginner",
    category: "Development",
    smallDescription: "This is a demo course rendered from fake data.",
    chapter: [
      {
        id: id + "-chapter-1",
        title: "Introduction",
        lessons: [
          { id: id + "-lesson-1", title: "Welcome" },
          { id: id + "-lesson-2", title: "Getting Started" },
        ],
      },
      {
        id: id + "-chapter-2",
        title: "Deep Dive",
        lessons: [
          { id: id + "-lesson-3", title: "Core Concepts" },
        ],
      },
    ],
  };
}
