import { requireAdmin } from "./require-admin";

const recentCourses = [
  {
    id: "1",
    title: "Getting Started with MarshalLMS",
    smallDescription: "Learn how to navigate the platform and manage your courses.",
    duration: 1,
    level: "Beginner",
    status: "Published",
    price: 0,
    fileKey: "demo-getting-started",
    slug: "getting-started-with-marshal-lms",
  },
  {
    id: "2",
    title: "Building Your First Course",
    smallDescription: "Create a complete course using our UI-only demo.",
    duration: 2,
    level: "Intermediate",
    status: "Draft",
    price: 39,
    fileKey: "demo-first-course",
    slug: "building-your-first-course",
  },
];

export async function adminGetRecentCourses() {
  // Demo-only: return static recent courses, no DB
  await requireAdmin();
  return recentCourses;
}
