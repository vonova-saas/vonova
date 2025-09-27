import mongoose, { Document, Schema, Types } from "mongoose";

export type LibraryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Author { name: string; avatarUrl?: string }

export interface BookDocument extends Document {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  authors: Author[];
  topics: string[]; // topic slugs
  level?: Level;
  coverUrl?: string;
  language?: string;
  status: LibraryStatus;
  metrics: { views: number; favoritesCount: number; ratingAverage: number; ratingCount: number };
  badges?: string[];
  fileAssetId?: Types.ObjectId | null;
  pageCount?: number;
  readingTimeMin?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const authorSchema = new Schema<Author>({
  name: { type: String, required: true },
  avatarUrl: { type: String },
}, { _id: false });

const bookSchema = new Schema<BookDocument>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  summary: { type: String },
  description: { type: String },
  authors: { type: [authorSchema], default: [] },
  topics: { type: [String], default: [] },
  level: { type: String, enum: ["Beginner","Intermediate","Advanced"], default: "Beginner" },
  coverUrl: { type: String },
  language: { type: String, default: "en" },
  status: { type: String, enum: ["DRAFT","PUBLISHED","ARCHIVED"], default: "DRAFT" },
  metrics: { type: new Schema({ views: { type: Number, default: 0 }, favoritesCount: { type: Number, default: 0 }, ratingAverage: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 } }, { _id: false }), default: {} },
  badges: { type: [String], default: [] },
  fileAssetId: { type: Schema.Types.ObjectId, ref: "LibraryAsset", default: null },
  pageCount: { type: Number, default: 0 },
  readingTimeMin: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

bookSchema.index({ title: "text", summary: "text", description: "text" });

const BookModel = mongoose.model<BookDocument>("LibraryBook", bookSchema);
export default BookModel;
