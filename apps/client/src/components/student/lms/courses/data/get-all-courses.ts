const fakeCourses = [
  {
    id: "course-1",
    title: "Demo React Fundamentals",
    price: 0,
    smallDescription: "Learn the basics of React in this demo course.",
    slug: "demo-react-fundamentals",
    fileKey: "demo-react-thumb",
    level: "Beginner",
    duration: 3,
    category: "Development",
  },
  {
    id: "course-2",
    title: "Advanced TypeScript Workshop",
    price: 49,
    smallDescription: "Deep dive into TypeScript features and patterns.",
    slug: "advanced-typescript-workshop",
    fileKey: "demo-ts-thumb",
    level: "Intermediate",
    duration: 5,
    category: "Development",
  },
  {
    id: "course-3",
    title: "UI Design Essentials",
    price: 29,
    smallDescription: "Design beautiful interfaces with practical examples.",
    slug: "ui-design-essentials",
    fileKey: "demo-ui-thumb",
    level: "Beginner",
    duration: 4,
    category: "Design",
  },
];

export async function getAllCourses() {
  // Demo-only: return static fake courses, no DB
  return fakeCourses;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
