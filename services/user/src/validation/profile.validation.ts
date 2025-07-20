import { z } from "zod";

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
