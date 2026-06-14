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
    hashtags: {
      type: [String],
      default: [],
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'FOLLOWERS'],
      default: 'PUBLIC',
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      default: null,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupChannel',
      default: null,
      index: true,
    },
    postType: {
      type: String,
      enum: ['DISCUSSION', 'ANNOUNCEMENT', 'QUESTION', 'RESOURCE'],
      default: 'DISCUSSION',
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    instructorOnly: {
      type: Boolean,
      default: false,
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
    /** Rich attachments for group/community posts (voice, video, PDF, etc.). */
    attachmentsMeta: {
      type: [
        new Schema(
          {
            type: {
              type: String,
              enum: ['IMAGE', 'VIDEO', 'PDF', 'VOICE', 'FILE'],
              required: true,
            },
            url: { type: String, required: true },
            key: { type: String, required: true },
            mimeType: { type: String, default: null },
            size: { type: Number, default: 0 },
            duration: { type: Number, default: null },
            name: { type: String, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** AI / human moderation lifecycle state. */
    moderationState: {
      type: String,
      enum: ['PENDING', 'CLEARED', 'FLAGGED', 'SHADOW_BLOCKED', 'REMOVED'],
      default: 'PENDING',
      index: true,
    },
    /**
     * When true the post is rendered to the author only. Used for spam /
     * harassment shadow-blocks so the originator never knows.
     */
    isShadowBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationSeverity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: null,
    },
    moderationCategories: {
      type: [String],
      default: [],
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

// Legacy `unique_user_content` on { author, content } was dropped at runtime
// (see PostLegacyIndexCleanupService): it blocked legitimate repeats and reposts.
// Anti-spam uses a short time-window check in PostsService instead.
PostSchema.index({ author: 1, content: 1 }, { name: 'author_content_lookup' });

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPost {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  tags: string[];
  hashtags: string[];
  visibility: 'PUBLIC' | 'FOLLOWERS';
  courseId: Types.ObjectId | null;
  groupId: Types.ObjectId | null;
  channelId: Types.ObjectId | null;
  postType: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';
  isPinned?: boolean;
  instructorOnly?: boolean;
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
