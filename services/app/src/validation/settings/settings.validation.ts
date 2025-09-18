import { z } from "zod";

export const updateUserSettingsSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
});