import { z } from "zod";

export const enrollCourseSchema = z.object({
  // If integrating payments later, accept paymentIntentId or coupon
  couponCode: z.string().optional(),
});

export const markLessonCompleteSchema = z.object({
  completed: z.boolean().default(true),
  timeSpentSec: z.number().min(0).optional(),
});
