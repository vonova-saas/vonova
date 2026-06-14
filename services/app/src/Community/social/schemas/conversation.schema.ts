import { Schema } from 'mongoose';

export const DirectConversationSchema = new Schema(
  {
    /** Deterministic key for two-user DMs: `minId_maxId` hex strings sorted. */
    pairKey: { type: String, unique: true, sparse: true, index: true },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: [(v: unknown[]) => Array.isArray(v) && v.length === 2, 'Exactly two participants'],
    },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: () => new Date() },
    /**
     * Per-participant cursor of the last message they have seen.
     * Stored as a string-keyed map (userId -> messageId hex string) so the
     * schema works seamlessly for two-user DMs without an extra collection.
     */
    lastSeenMessage: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
    lastSeenAt: {
      type: Map,
      of: Date,
      default: () => new Map<string, Date>(),
    },
  },
  { timestamps: true },
);

DirectConversationSchema.index({ participants: 1 });
