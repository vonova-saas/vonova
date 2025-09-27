import mongoose, { Document, Schema, Types } from "mongoose";

export interface BookProgressDocument extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  lastPage: number;
  timeSpentSec: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookProgressSchema = new Schema<BookProgressDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
  lastPage: { type: Number, default: 0 },
  timeSpentSec: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

bookProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

const BookProgressModel = mongoose.model<BookProgressDocument>("LibraryBookProgress", bookProgressSchema);
export default BookProgressModel;
