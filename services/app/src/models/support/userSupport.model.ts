import mongoose, { Document, Schema } from "mongoose";

export interface UserSupportMessage {
  sender: 'user' | 'agent';
  message: string;
  createdAt?: Date;
}

export interface UserSupportDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  fullName: string;
  email: string;
  category: "technical" | "billing" | "general" | "feature-request" | "bug-report";
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  messages: UserSupportMessage[];
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
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
      required: true,
    },
    messages: [
      new Schema<UserSupportMessage>(
        {
          sender: { type: String, enum: ['user', 'agent'], required: true },
          message: { type: String, required: true, maxlength: 2000 },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    ],
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
