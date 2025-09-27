import { z } from "zod";

export const createChapterSchema = z.object({
  title: z.string().min(1),
  index: z.number().int().min(0).optional(),
});

export const updateChapterSchema = createChapterSchema.partial();

export const reorderChaptersSchema = z.object({
  order: z.array(z.object({ chapterId: z.string(), index: z.number().int().min(0) })).min(1),
});
