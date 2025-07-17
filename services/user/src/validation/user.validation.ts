import { z } from "zod";

export const updateDashboardDataSchema = z.object({
  enrolledCourses: z
    .array(
      z.object({
        courseId: z.string(),
        title: z.string(),
        progress: z.number().min(0).max(100),
        completed: z.boolean(),
        lastAccessed: z.coerce.date().optional(),
      })
    )
    .optional(),
  completedCourses: z.array(z.string()).optional(),
  quizzesTaken: z
    .array(
      z.object({
        quizId: z.string(),
        courseId: z.string(),
        score: z.number().min(0),
        takenAt: z.coerce.date(),
      })
    )
    .optional(),
  materialsAccessed: z
    .array(
      z.object({
        materialId: z.string(),
        courseId: z.string(),
        accessedAt: z.coerce.date(),
      })
    )
    .optional(),
  aiRoadmap: z
    .object({
      generatedAt: z.coerce.date(),
      topics: z.array(z.string()),
      recommendedOrder: z.array(z.string()),
    })
    .partial()
    .optional(),
  aiVideoSuggestions: z
    .array(
      z.object({
        topic: z.string(),
        videoUrl: z.string().url(),
        generatedAt: z.coerce.date(),
      })
    )
    .optional(),
  aiProblemSolvingStats: z
    .object({
      totalProblemsSolved: z.number().min(0),
      mentorSessions: z
        .array(
          z.object({
            sessionId: z.string(),
            mentorName: z.string(),
            problemId: z.string(),
            solved: z.boolean(),
            sessionDate: z.coerce.date(),
          })
        )
        .optional(),
    })
    .partial()
    .optional(),
}); 

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: z.string().max(200).optional(),
  social: z
    .object({
      facebook: z.string().url().optional(),
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
    })
    .partial()
    .optional(),
});

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
