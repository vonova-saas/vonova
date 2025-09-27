import { z } from "zod";

export const authorSchema = z.object({ name: z.string().min(1), avatarUrl: z.string().url().optional() });

export const createBookSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  authors: z.array(authorSchema).default([]),
  topics: z.array(z.string()).default([]),
  level: z.enum(["Beginner","Intermediate","Advanced"]).optional(),
  coverUrl: z.string().url().optional(),
  language: z.string().optional(),
  badges: z.array(z.string()).optional(),
});

export const updateBookSchema = createBookSchema.partial();
export const publishBookSchema = z.object({ status: z.enum(["PUBLISHED","ARCHIVED"]).default("PUBLISHED") });
