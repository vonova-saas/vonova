import mongoose, { Document, Schema } from "mongoose";

export interface UserNotificationDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  notifyMe: 'all' | 'mentions' | 'none';
  communicationEmails?: boolean;
  marketingEmails?: boolean;
  socialEmails?: boolean;
  securityEmails?: boolean;
}

const userNotificationSchema = new Schema<UserNotificationDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notifyMe: {
      type: String,
      enum: ['all', 'mentions', 'none'],
      default: 'all',
      trim: true,
    },
    communicationEmails: {
      type: Boolean,
      default: null,
    },
    marketingEmails: {
      type: Boolean,
      default: null,
    },
    socialEmails: {
      type: Boolean,
      default: null,
    },
    securityEmails: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Add index for faster lookups
userNotificationSchema.index({ userId: 1 }, { unique: true });

const UserNotificationModel = mongoose.model<UserNotificationDocument>("UserNotification", userNotificationSchema);
export default UserNotificationModel;