import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  smallDescription: z.string().optional(),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  trailerUrl: z.string().url().optional(),
  language: z.string().optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string().min(1),
    isFree: z.boolean().default(false),
  }),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: z.enum(["DRAFT","PUBLISHED","ARCHIVED"]).optional(),
});

export const publishCourseSchema = z.object({
  status: z.enum(["PUBLISHED","ARCHIVED"]).default("PUBLISHED"),
});
