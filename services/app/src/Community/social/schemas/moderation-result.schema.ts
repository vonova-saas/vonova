import { Schema } from 'mongoose';

export const MODERATION_TARGETS = [
  'POST',
  'COMMENT',
  'MESSAGE',
  'PROFILE',
  'ARTICLE',
] as const;
export type ModerationTarget = (typeof MODERATION_TARGETS)[number];

export const MODERATION_CATEGORIES = [
  'TOXICITY',
  'HATE_SPEECH',
  'HARASSMENT',
  'NSFW',
  'SPAM',
  'PHISHING',
  'SELF_HARM',
  'VIOLENCE',
  'EXTREMIST',
  'ILLEGAL',
] as const;
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

export const MODERATION_SEVERITY = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export type ModerationSeverity = (typeof MODERATION_SEVERITY)[number];

export const MODERATION_ACTIONS = [
  'ALLOW',
  'FLAG',
  'SHADOW_BLOCK',
  'DELETE',
  'ESCALATE',
] as const;
export type ModerationActionKind = (typeof MODERATION_ACTIONS)[number];

/**
 * Persistent record of an AI moderation pass. One row per target content
 * version — re-runs (e.g. re-moderation by an admin) produce additional rows
 * so the history is auditable.
 */
export const CommunityModerationResultSchema = new Schema(
  {
    targetType: { type: String, enum: MODERATION_TARGETS, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    /** Author of the offending content, for fast user-centric queries. */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    aiProvider: { type: String, default: 'heuristic-v1' },
    aiModel: { type: String, default: 'rule-based' },
    categories: {
      type: [{ type: String, enum: MODERATION_CATEGORIES }],
      default: [],
      index: true,
    },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    severity: {
      type: String,
      enum: MODERATION_SEVERITY,
      default: 'LOW',
      index: true,
    },
    action: {
      type: String,
      enum: MODERATION_ACTIONS,
      default: 'ALLOW',
      index: true,
    },
    /** Raw provider response for forensics (kept small). */
    rawResponse: { type: Schema.Types.Mixed, default: null },
    /** When set, content has been reviewed by a human moderator. */
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    /** Final disposition from human review, separate from AI suggestion. */
    reviewedAction: {
      type: String,
      enum: MODERATION_ACTIONS,
      default: null,
    },
  },
  { timestamps: true },
);

CommunityModerationResultSchema.index({ severity: 1, action: 1, createdAt: -1 });
CommunityModerationResultSchema.index({ reviewedAt: 1, severity: 1 });
