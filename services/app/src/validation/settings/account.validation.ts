import { z } from "zod";

export const updateUserAccountSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string({ required_error: "Email is required", }).email("Invalid email address").toLowerCase().trim().min(1).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  address: z.string().max(200).nullable().optional(),
});
