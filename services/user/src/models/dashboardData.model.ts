import mongoose, { Document, Schema } from "mongoose";

export interface DashboardDataDocument extends Document {
  userId: string;
  studentDashboard?: {
    enrolledCourses: Array<{
      courseId: string;
      title: string;
      progress: number;
      completed: boolean;
      lastAccessed?: Date;
    }>;
    completedCourses: Array<string>;
    quizzesTaken: Array<{
      quizId: string;
      courseId: string;
      score: number;
      takenAt: Date;
    }>;
    materialsAccessed: Array<{
      materialId: string;
      courseId: string;
      accessedAt: Date;
    }>;
    aiRoadmap?: {
      generatedAt: Date;
      topics: Array<string>;
      recommendedOrder: Array<string>;
    };
    aiVideoSuggestions?: Array<{
      topic: string;
      videoUrl: string;
      generatedAt: Date;
    }>;
    aiProblemSolvingStats?: {
      totalProblemsSolved: number;
      mentorSessions: Array<{
        sessionId: string;
        mentorName: string;
        problemId: string;
        solved: boolean;
        sessionDate: Date;
      }>;
    };
    // ... add more student-specific fields as needed
  };
  instructorDashboard?: {
    coursesCreated?: Array<{
      courseId: string;
      title: string;
      studentsEnrolled: number;
      createdAt: Date;
    }>;
    studentsManaged?: Array<{
      studentId: string;
      name: string;
      progress: number;
    }>;
    analytics?: {
      totalCourses: number;
      totalStudents: number;
      averageProgress: number;
    };
    // ... add more instructor-specific fields as needed
  };
  adminDashboard?: {
    userStats?: {
      totalUsers: number;
      activeUsers: number;
      verifiedUsers: number;
    };
    systemLogs?: Array<{
      logId: string;
      action: string;
      performedBy: string;
      timestamp: Date;
    }>;
    // ... add more admin-specific fields as needed
  };
}

const dashboardDataSchema = new Schema<DashboardDataDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
    studentDashboard: {
      enrolledCourses: {
        type: [Object],
        default: [],
      },
      completedCourses: {
        type: [String],
        default: [],
      },
      quizzesTaken: {
        type: [Object],
        default: [],
      },
      materialsAccessed: {
        type: [Object],
        default: [],
      },
      aiRoadmap: {
        type: Object,
        default: null,
      },
      aiVideoSuggestions: {
        type: [Object],
        default: [],
      },
      aiProblemSolvingStats: {
        type: Object,
        default: null,
      },
    },
    instructorDashboard: {
      type: Object,
      default: null,
    },
    adminDashboard: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

dashboardDataSchema.index({ userId: 1 });

const DashboardDataModel = mongoose.model<DashboardDataDocument>("DashboardData", dashboardDataSchema);
export default DashboardDataModel;
