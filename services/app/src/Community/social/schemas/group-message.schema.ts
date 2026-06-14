import { Schema } from 'mongoose';
import { AttachmentMetaSchema } from './message.schema';

export const GroupMessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio'],
      default: 'text',
    },
    text: { type: String, default: '', maxlength: 8000, trim: true },
    attachmentUrl: { type: String, default: null },
    mimeType: { type: String, default: null },
    attachmentsMeta: { type: [AttachmentMetaSchema], default: [] },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMessage',
      default: null,
    },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    /** Hidden from members but retained for moderators (shadow-hide). */
    shadowHidden: { type: Boolean, default: false, index: true },
    /** Per-user read cursor: userId -> last seen message ObjectId */
    seenBy: {
      type: Map,
      of: Schema.Types.ObjectId,
      default: {},
    },
    reactions: {
      type: [
        new Schema(
          {
            emoji: { type: String, required: true, maxlength: 16 },
            userId: {
              type: Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

GroupMessageSchema.index({ groupId: 1, createdAt: -1 });
GroupMessageSchema.index({ groupId: 1, deletedAt: 1, createdAt: -1 });
GroupMessageSchema.index({ groupId: 1, text: 1 });
