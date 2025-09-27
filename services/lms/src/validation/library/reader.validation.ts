import { z } from "zod";

export const updateBookProgressSchema = z.object({
  lastPage: z.number().int().min(0),
  timeSpentSec: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export const favoriteToggleSchema = z.object({
  // no body needed for favorite toggle via POST/DELETE; keep placeholder for consistency
});
