import mongoose, { Document, Schema, Types } from "mongoose";

export interface LessonProgressDocument extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  timeSpentSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<LessonProgressDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  timeSpentSec: { type: Number, default: 0 },
}, { timestamps: true });

lessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const LessonProgressModel = mongoose.model<LessonProgressDocument>("LessonProgress", lessonProgressSchema);
export default LessonProgressModel;
