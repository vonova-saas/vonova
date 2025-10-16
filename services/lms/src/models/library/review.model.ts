import mongoose, { Document, Schema } from "mongoose";

export interface LibraryReviewDocument extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  itemType: "BOOK" | "GUIDE" | "PRESENTATION";
  itemId: mongoose.Schema.Types.ObjectId;
  rating: number;
  title?: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<LibraryReviewDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ["BOOK", "GUIDE", "PRESENTATION"],
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String
  },
  body: {
    type: String
  },
}, { timestamps: true });

reviewSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const LibraryReviewModel = mongoose.model<LibraryReviewDocument>("LibraryReview", reviewSchema);
export default LibraryReviewModel;
