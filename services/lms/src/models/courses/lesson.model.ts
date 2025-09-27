import mongoose, { Document, Schema, Types } from "mongoose";

export type LessonType = "VIDEO" | "ARTICLE" | "QUIZ";

export interface LessonDocument extends Document {
  courseId: Types.ObjectId;
  chapterId: Types.ObjectId;
  title: string;
  index: number;
  durationMinutes?: number;
  type: LessonType;
  previewable: boolean;
  content?: string; // for ARTICLE; for VIDEO we will link Asset later
  videoAssetId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<LessonDocument>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
  title: { type: String, required: true },
  index: { type: Number, required: true, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  type: { type: String, enum: ["VIDEO","ARTICLE","QUIZ"], default: "VIDEO" },
  previewable: { type: Boolean, default: false },
  content: { type: String },
  videoAssetId: { type: Schema.Types.ObjectId, ref: "Asset", default: null },
}, { timestamps: true });

lessonSchema.index({ courseId: 1, chapterId: 1, index: 1 }, { unique: false });

const LessonModel = mongoose.model<LessonDocument>("Lesson", lessonSchema);
export default LessonModel;
