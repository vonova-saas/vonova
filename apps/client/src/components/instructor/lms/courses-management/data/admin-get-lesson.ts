import { requireAdmin } from "./require-admin";

export async function adminGetLesson(id: string) {
  await requireAdmin();

  // Demo-only: return a fake lesson object, no DB
  return {
    id,
    title: "Demo Lesson " + id,
    description: "This is a demo lesson used in UI-only mode.",
    videoKey: null,
    thumbnailKey: null,
    position: 1,
  };
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;