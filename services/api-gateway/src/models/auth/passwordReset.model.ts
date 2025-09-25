import mongoose, { Document, Schema } from "mongoose";

export interface PasswordResetDocument extends Document {
  email: string;
  resetCode: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetSchema = new Schema<PasswordResetDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    resetCode: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
    // Automatically delete documents after they expire
    expires: 600 // 10 minutes in seconds
  }
);

// Index for efficient queries
passwordResetSchema.index({ email: 1, resetCode: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetModel = mongoose.model<PasswordResetDocument>(
  "PasswordReset",
  passwordResetSchema
);

export default PasswordResetModel;