import { z } from "zod";

export const updateUserNotificationSchema = z.object({
  notifyMe: z.enum(["all", "mentions", "none"]).optional(),
  communicationEmails: z.boolean().nullable().optional(),
  marketingEmails: z.boolean().nullable().optional(),
  socialEmails: z.boolean().nullable().optional(),
  securityEmails: z.boolean().nullable().optional(),
});
