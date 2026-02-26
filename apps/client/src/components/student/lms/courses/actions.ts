"use server";

import { ApiResponse } from "@/lib/courses/types";

export async function markLessonComlete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  // Demo-only: no DB, no auth, no cache revalidation
  console.log("Demo markLessonComlete called", { lessonId, slug });

  return {
    status: "success",
    message: "Progress updated (demo mode)",
  };
}
