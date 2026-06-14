import { Schema } from 'mongoose';

export const UserNotificationPreferencesSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    groupChat: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    enrollments: { type: Boolean, default: true },
    quizzes: { type: Boolean, default: true },
    lessons: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  { timestamps: true },
);
