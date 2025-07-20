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

// Validation schemas for PATCH routes
export const updateLearningProgressSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  progress: z.number().min(0).max(100, "Progress must be between 0 and 100"),
});

export const addQuizPerformanceSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  score: z.number().min(0, "Score must be non-negative"),
});

export const updateAIRoadmapSchema = z.object({
  topics: z.array(z.string().min(1, "Topic cannot be empty")),
  recommendedOrder: z.array(z.string().min(1, "Recommended order item cannot be empty")),
});

export const addAIVideoSuggestionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  videoUrl: z.string().url("Video URL must be a valid URL"),
});

export const addCourseCreatedSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(1, "Course title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});