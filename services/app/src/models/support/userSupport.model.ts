import mongoose, { Document, Schema } from "mongoose";

export interface UserSupportDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  fullName: string;
  email: string;
  category: "technical" | "billing" | "general" | "feature-request" | "bug-report";
  subject: string;
  message: string;
}

const userSupportSchema = new Schema<UserSupportDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      enum: ["technical", "billing", "general", "feature-request", "bug-report"],
      required: true,
      default: "technical"
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    }
  },
  {
    timestamps: true,
    minimize: false, // Ensures empty objects are stored
  }
);

// Add index for faster lookups
userSupportSchema.index({ userId: 1 }, { unique: false });

const UserSupportModel = mongoose.model<UserSupportDocument>("UserSupport", userSupportSchema);
export default UserSupportModel;
