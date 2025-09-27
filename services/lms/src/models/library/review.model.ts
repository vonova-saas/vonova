import mongoose, { Document, Schema, Types } from "mongoose";

export interface LibraryReviewDocument extends Document {
  userId: Types.ObjectId;
  itemType: "BOOK" | "GUIDE" | "PRESENTATION";
  itemId: Types.ObjectId;
  rating: number;
  title?: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<LibraryReviewDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: { type: String, enum: ["BOOK","GUIDE","PRESENTATION"], required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  body: { type: String },
}, { timestamps: true });

reviewSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const LibraryReviewModel = mongoose.model<LibraryReviewDocument>("LibraryReview", reviewSchema);
export default LibraryReviewModel;
