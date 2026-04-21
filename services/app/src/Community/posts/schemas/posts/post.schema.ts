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
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    imageKey: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: null,
    },
    imageKeys: {
      type: [String],
      default: null,
    },
    video: {
      type: String,
      default: null,
    },
    videoKey: {
      type: String,
      default: null,
    },
    videos: {
      type: [String],
      default: null,
    },
    videoKeys: {
      type: [String],
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
    sharedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    shareComment: {
      type: String,
      default: null,
      maxlength: 500,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

// Unique index to prevent exact duplicate posts from same user
PostSchema.index(
  { author: 1, content: 1 }, 
  { 
    unique: true,
    sparse: true,
    name: 'unique_user_content',
    // This will prevent exact duplicates but allow similar content
  }
);

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPost {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  tags: string[];
  image: string | null;
  imageKey: string | null;
  images: string[] | null;
  imageKeys: string[] | null;
  video: string | null;
  videoKey: string | null;
  videos: string[] | null;
  videoKeys: string[] | null;
  likes: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  sharedPost: Types.ObjectId | null;
  shareComment: string | null;
  sharedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = IPost & Document;
