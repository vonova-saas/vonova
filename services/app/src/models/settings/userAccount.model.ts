import mongoose, { Document, Schema } from "mongoose";

export interface UserAccountDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  address?: string;
}

const userAccountSchema = new Schema<UserAccountDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: null
    },
    dateOfBirth: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Add index for faster lookups
userAccountSchema.index({ userId: 1 }, { unique: true });

const UserAccountModel = mongoose.model<UserAccountDocument>("UserAccount", userAccountSchema);
export default UserAccountModel;