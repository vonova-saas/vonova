import { Schema } from 'mongoose';

/**
 * Audit log for every moderation action taken inside a community group.
 *
 * One row = one human-initiated action. Useful both for surfacing recent
 * moderator activity in an analytics dashboard and for compliance / dispute
 * resolution down the line.
 */
export const MODERATION_ACTIONS = [
  'MUTE_MEMBER',
  'UNMUTE_MEMBER',
  'REMOVE_MEMBER',
  'BAN_MEMBER',
  'UNBAN_MEMBER',
  'APPROVE_MEMBER',
  'PIN_POST',
  'UNPIN_POST',
  'DELETE_POST',
  'LOCK_CHANNEL',
  'UNLOCK_CHANNEL',
  'SLOW_MODE',
] as const;

export const CommunityModerationLogSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: MODERATION_ACTIONS,
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetPostId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
    targetChannelId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupChannel',
      default: null,
    },
    reason: { type: String, default: null, maxlength: 500 },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

CommunityModerationLogSchema.index({ groupId: 1, createdAt: -1 });
