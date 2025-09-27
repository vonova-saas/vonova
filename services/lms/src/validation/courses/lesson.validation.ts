import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1),
  index: z.number().int().min(0).optional(),
  durationMinutes: z.number().min(0).optional(),
  type: z.enum(["VIDEO","ARTICLE","QUIZ"]).default("VIDEO"),
  previewable: z.boolean().default(false),
  content: z.string().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonsSchema = z.object({
  order: z.array(z.object({ lessonId: z.string(), index: z.number().int().min(0) })).min(1),
});
