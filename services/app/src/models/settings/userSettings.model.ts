import mongoose, { Document, Schema } from "mongoose";

export interface UserSettingsDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  font: string;
  fontSize: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
}

const userSettingsSchema = new Schema<UserSettingsDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    font: {
      type: String,
      default: "Inter",
    },
    fontSize: {
      type: String,
      default: "16",
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: "system",
    },
    language: {
      type: String,
      default: "en",
    },
    timezone: {
      type: String,
      default: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
  },
  {
    timestamps: true,
    minimize: false, // Ensures empty objects are stored
  }
);

// Add index for faster lookups
userSettingsSchema.index({ userId: 1 }, { unique: true });

// Add method to get default settings
userSettingsSchema.statics.getDefaultSettings = function () {
  return {
    general: {
      font: "Inter",
      fontSize: "16",
      language: "en",
      theme: "system",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: "MM/DD/YYYY",
    },
  };
};

const UserSettingsModel = mongoose.model<UserSettingsDocument>("UserSettings", userSettingsSchema);
export default UserSettingsModel;
