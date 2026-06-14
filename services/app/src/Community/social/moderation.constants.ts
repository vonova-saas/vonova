/** Shared moderation enums for reports, actions, and audit logs. */

export const REPORT_TARGET_TYPES = [
  'POST',
  'COMMENT',
  'REPOST',
  'MESSAGE',
  'USER',
  'GROUP',
] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'violence',
  'misinformation',
  'impersonation',
  'nsfw',
  'copyright',
  'scam',
  'illegal-content',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  'OPEN',
  'REVIEWING',
  'RESOLVED',
  'REJECTED',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const MODERATION_RESOLUTION_ACTIONS = [
  'REMOVE_CONTENT',
  'WARN_USER',
  'TEMP_MUTE',
  'TEMP_BAN',
  'PERMANENT_BAN',
  'NO_ACTION',
] as const;
export type ModerationResolutionAction =
  (typeof MODERATION_RESOLUTION_ACTIONS)[number];

export const PLATFORM_AUDIT_ENTITY_TYPES = [
  'POST',
  'COMMENT',
  'REPOST',
  'MESSAGE',
  'USER',
  'GROUP',
  'REPORT',
] as const;

export const AUTO_MOD_FLAGS = [
  'EXCESSIVE_LINKS',
  'REPEATED_SPAM',
  'FLOOD_POSTING',
  'SUSPICIOUS_MENTIONS',
  'EMOJI_SPAM',
] as const;
