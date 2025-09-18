import { z } from "zod";

export const userSupportSchema = z.object({
  fullName: z.string().optional(),
  email: z.string({ required_error: "Email is required", }).email("Invalid email address").toLowerCase().trim().min(1).optional(),
  category: z.enum(["technical", "billing", "general", "feature-request", "bug-report"]).optional(),
  subject: z.string().max(200, "Subject must be at most 200 characters").optional(),
  message: z.string().max(2000, "Message must be at most 2000 characters").optional(),
});