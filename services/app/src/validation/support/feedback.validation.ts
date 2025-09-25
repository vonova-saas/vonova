import { z } from "zod";

export const userFeedbackSchema = z.object({
  feedbackType: z.enum(["bug-report", "feature-request", "suggestion", "other"]).optional(),
  userBugReport: z.string().max(2000, "Your bug report must be at most 2000 characters").nullable().optional(),
  userSuggestion: z.string().max(2000, "Your suggestion must be at most 2000 characters").nullable().optional(),
  userFeatureRequest: z.string().max(2000, "Your feature request must be at most 2000 characters").nullable().optional(),
  userOther: z.string().max(2000, "Your other feedback must be at most 2000 characters").nullable().optional(),
  email: z.string({ required_error: "Email is required", }).email("Invalid email address").toLowerCase().trim().min(1).nullable().optional(),
});

export const userFeedbackMessageSchema = z.object({
  message: z.string().max(2000, "Message must be at most 2000 characters"),
});

export const userFeedbackStatusSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']),
});