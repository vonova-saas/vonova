import { Schema } from 'mongoose';

/**
 * Rich attachment metadata for messages, group posts, and other shareable
 * surfaces. Kept structural (no class) so it can be reused across schemas.
 */
const AttachmentMetaSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'PDF', 'VOICE', 'FILE'],
      required: true,
    },
    url: { type: String, required: true },
    key: { type: String, required: true },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0, min: 0 },
    /** Duration in seconds — used for VOICE / VIDEO. */
    duration: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    name: { type: String, default: null },
  },
  { _id: false },
);

export const DirectMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'DirectConversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /**
     * For voice-only / attachment-only messages we still accept an empty
     * string but the application layer guarantees at least one of content
     * or attachments is set.
     */
    content: { type: String, default: '', maxlength: 8000, trim: true },
    /** Back-compat: plain URL list (legacy clients). */
    attachments: { type: [String], default: [] },
    /** Rich attachments — voice messages, images, PDFs, video, generic files. */
    attachmentsMeta: { type: [AttachmentMetaSchema], default: [] },
    seenBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    /** Set when the sender edits text after send. */
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

DirectMessageSchema.index({ conversationId: 1, createdAt: -1 });

export { AttachmentMetaSchema };
