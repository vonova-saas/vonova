import { Schema, Document, Types } from 'mongoose';

// ─── Post Schema ──────────────────────────────────────────────────────────────

export const PostSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      default: null,
    },
    imageKey: {
      type: String,
      default: null,
    },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// Indexes for performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPost {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  image: string | null;
  imageKey: string | null;
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = IPost & Document;
