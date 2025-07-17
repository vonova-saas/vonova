import mongoose, { Document, Schema } from "mongoose";

export interface DashboardDataDocument extends Document {
  userId: string;
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
  [key: string]: any;
}

const dashboardDataSchema = new Schema<DashboardDataDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
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
  {
    timestamps: true,
  }
);

const DashboardDataModel = mongoose.model<DashboardDataDocument>("DashboardData", dashboardDataSchema);
export default DashboardDataModel;
