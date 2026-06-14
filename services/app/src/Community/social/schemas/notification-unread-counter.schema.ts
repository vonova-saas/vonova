import { Schema } from 'mongoose';

/** Lightweight unread counter per user (avoids countDocuments on hot paths). */
export const NotificationUnreadCounterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    unread: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
