import { z } from "zod";

export const updateUserSettingsSchema = z.object({
  language: z.string().min(2).max(10).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .partial()
    .optional(),
  privacy: z
    .object({
      profileVisible: z.boolean().optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
    })
    .partial()
    .optional(),
});