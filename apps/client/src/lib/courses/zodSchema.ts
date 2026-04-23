import z from "zod";

export const courseLevels = ["Beginner", "Intermidate", "Advanced"] as const;
export const courseStatus = ["Draft", "Published", "Archive"] as const;

export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "It & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),

  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),

  fileKey: z.string().optional(),

  // price: z.number().min(1, { message: "Price must be positive number" }),

  // duration: z
  //   .number()
  //   .min(1, { message: "Duration must be at least 1 hour" })
  //   .max(500, { message: "Duration must be at most 500 hours" }),

  price: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    },
    z.number().min(0, { message: "Price must be 0 or greater" })
  ) as unknown as z.ZodNumber,

  duration: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    },
    z
      .number()
      .min(0, { message: "Duration must be 0 or greater" })
      .max(500, { message: "Duration must be at most 500 hours" })
      .optional()
  ) as unknown as z.ZodNumber,

  level: z.enum(courseLevels, { message: "level is required" }),

  category: z.enum(courseCategories, { message: "Category is required" }),

  smallDescription: z
    .string()
    .min(3, { message: "small Description must be at least 3 characters long" })
    .max(200, {
      message: "small Description must be at most 200 characters long",
    }),

  slug: z.string().min(3, {
    message: "slug Description must be at least 3 characters long",
  }),

  status: z.enum(courseStatus, {
    message: "status is required",
  }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().min(1, { message: "Course ID is required" }),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().min(1, { message: "Course ID is required" }),
  chapterId: z.string().min(1, { message: "Chapter ID is required" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
