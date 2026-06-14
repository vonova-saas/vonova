import { Schema } from 'mongoose';

export const CommunityNotificationType = [
  'LIKE',
  'COMMENT',
  'REPLY',
  'REPOST',
  'MENTION',
  'FOLLOW',
  'MESSAGE',
  'ENROLLMENT',
  'COURSE_ANNOUNCEMENT',
  'GROUP_CHAT',
  'LESSON_PUBLISHED',
  'QUIZ_PUBLISHED',
  'QUIZ_RESULT',
  'SHEET_ASSIGNED',
  'GROUP_INVITE',
  'COURSE_INVITE',
] as const;

export const CommunityNotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: CommunityNotificationType,
      required: true,
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    entityType: {
      type: String,
      enum: ['POST', 'COMMENT', 'USER', 'GROUP', 'COURSE', 'LESSON', 'QUIZ', 'SHEET', 'MESSAGE'],
      default: null,
    },
    entityId: { type: String, default: null, index: true },
    title: { type: String, default: '', maxlength: 200 },
    message: { type: String, default: '', maxlength: 500 },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, default: null, sparse: true },
  },
  { timestamps: true },
);

CommunityNotificationSchema.index({ userId: 1, createdAt: -1 });
CommunityNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
CommunityNotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
CommunityNotificationSchema.index({ entityId: 1, entityType: 1 });
