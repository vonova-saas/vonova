import mongoose, { Document, Schema } from "mongoose";

export type LibraryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Author { name: string; avatarUrl?: string }

export interface GuideMetrics {
  views: number;
  favoritesCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface GuideDocument extends Document {
  createdBy: mongoose.Schema.Types.ObjectId;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  authors: Author[];
  topics: string[];
  level?: Level;
  coverUrl?: string;
  language?: string;
  status: LibraryStatus;
  metrics: GuideMetrics;
  badges?: string[];
  fileAssetId?: mongoose.Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const authorSchema = new Schema<Author>({
  name: { type: String, required: true },
  avatarUrl: { type: String },
}, { _id: false });

const metricsSchema = new Schema<GuideMetrics>({
  views: {
    type: Number,
    default: 0
  },
  favoritesCount: {
    type: Number,
    default: 0
  },
  ratingAverage: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const guideSchema = new Schema<GuideDocument>({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  summary: {
    type: String
  },
  description: {
    type: String
  },
  authors: {
    type: [authorSchema],
    default: []
  },
  topics: {
    type: [String],
    default: []
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner"
  },
  coverUrl: {
    type: String
  },
  language: {
    type: String,
    default: "en"
  },
  status: {
    type: String,
    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    default: "DRAFT"
  },
  metrics: {
    type: metricsSchema,
    default: {}
  },
  badges: {
    type: [String],
    default: []
  },
  fileAssetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LibraryAsset",
    default: null
  },
}, { timestamps: true });

guideSchema.index({ title: "text", summary: "text", description: "text" });

const GuideModel = mongoose.model<GuideDocument>("LibraryGuide", guideSchema);
export default GuideModel;
