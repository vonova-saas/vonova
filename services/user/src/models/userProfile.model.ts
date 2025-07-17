import mongoose, { Document, Schema } from "mongoose";

export interface UserProfileDocument extends Document {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  address?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  };
}

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String
    },
    phone: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    social: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);


const UserModel = mongoose.model<UserProfileDocument>("User", userProfileSchema);
export default UserModel;