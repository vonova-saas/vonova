import mongoose, { Document, Schema } from "mongoose";

export interface UserSettingsDocument extends Document {
  userId: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  privacy?: {
    profileVisible?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
  };
  [key: string]: any; // For extensibility
}

const userSettingsSchema = new Schema<UserSettingsDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
    language: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notifications: {
      type: Object,
      default: { email: true, sms: false, push: true },
    },
    privacy: {
      type: Object,
      default: { profileVisible: true, showEmail: false, showPhone: false },
    },
  },
  {
    timestamps: true,
  }
);

const UserSettingsModel = mongoose.model<UserSettingsDocument>("UserSettings", userSettingsSchema);
export default UserSettingsModel;
