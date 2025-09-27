import mongoose, { Document, Schema, Types } from "mongoose";

export interface ReviewDocument extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  rating: number; // 1..5
  title?: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  body: { type: String },
}, { timestamps: true });

reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const ReviewModel = mongoose.model<ReviewDocument>("Review", reviewSchema);
export default ReviewModel;
