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

export const updateStudentInfoSchema = z.object({
  studentId: z.string().optional(),
  enrollmentDate: z.coerce.date().optional(),
  currentLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredLearningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]).optional(),
  goals: z.array(z.string()).optional(),
  completedCourses: z.array(z.string()).optional(),
  certificates: z.array(z.string()).optional(),
  mentorId: z.string().optional(),
});

export const updateInstructorInfoSchema = z.object({
  instructorId: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  bio: z.string().max(1000).optional(),
  certifications: z.array(z.string()).optional(),
  coursesCreated: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  totalStudents: z.number().min(0).optional(),
  joinDate: z.coerce.date().optional(),
});

export const updateAdminInfoSchema = z.object({
  adminId: z.string().optional(),
  department: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  accessLevel: z.enum(["super", "admin", "moderator"]).optional(),
  assignedRegions: z.array(z.string()).optional(),
  lastLogin: z.coerce.date().optional(),
});
