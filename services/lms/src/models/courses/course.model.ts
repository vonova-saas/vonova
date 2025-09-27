import mongoose, { Document, Schema, Types } from "mongoose";

export interface CoursePrice { amount: number; currency: string; isFree: boolean; }
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CourseDocument extends Document {
  title: string;
  slug: string;
  smallDescription?: string;
  description?: string;
  difficulty?: string;
  categoryId?: Types.ObjectId | null;
  tags?: string[];
  thumbnailUrl?: string;
  trailerUrl?: string;
  language?: string;
  durationMinutes?: number; // derived
  totalLessons?: number; // derived
  averageRating?: number; // derived
  ratingCount?: number; // derived
  price: CoursePrice;
  status: CourseStatus;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const priceSchema = new Schema<CoursePrice>({
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: "USD" },
  isFree: { type: Boolean, required: true, default: false },
},{ _id: false });

const courseSchema = new Schema<CourseDocument>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  smallDescription: { type: String },
  description: { type: String },
  difficulty: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  tags: { type: [String], default: [] },
  thumbnailUrl: { type: String },
  trailerUrl: { type: String },
  language: { type: String, default: "en" },
  durationMinutes: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  price: { type: priceSchema, required: true },
  status: { type: String, enum: ["DRAFT","PUBLISHED","ARCHIVED"], default: "DRAFT" },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

courseSchema.index({ title: "text", smallDescription: "text", description: "text" });

const CourseModel = mongoose.model<CourseDocument>("Course", courseSchema);
export default CourseModel;
