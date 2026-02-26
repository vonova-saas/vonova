const fakeCourses = [
  {
    id: "1",
    title: "Intro to AI",
    description: "Learn the basics of artificial intelligence.",
    category: "Development",
    smallDescription: "Foundations of AI in 10 concise lessons.",
    duration: 3,
    level: "Beginner",
    status: "Published",
    price: 0,
    fileKey: "demo-ai",
    slug: "intro-to-ai",
  },
  {
    id: "2",
    title: "Advanced React Patterns",
    description: "Build scalable frontends with modern React patterns.",
    category: "Development",
    smallDescription: "Hooks, context, and advanced composition.",
    duration: 5,
    level: "Intermediate",
    status: "Draft",
    price: 49,
    fileKey: "demo-react",
    slug: "advanced-react-patterns",
  },
];

export async function adminGetCourses() {
  // Demo-only: return static fake courses, no DB
  return fakeCourses;
}

export type AdminCourseTypeSingularType = Awaited<ReturnType<typeof adminGetCourses>>[0];
export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[0];

