import mongoose, { Document, Schema } from "mongoose";

export interface UserFeedbackMessage {
  sender: 'user' | 'agent';
  message: string;
  createdAt?: Date;
}

export interface UserFeedbackDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  feedbackType: "bug-report" | "feature-request" | "suggestion" | "other";
  userBugReport?: string;
  userFeatureRequest?: string;
  userSuggestion?: string;
  userOther?: string;
  email?: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  messages: UserFeedbackMessage[];
}

const userFeedbackSchema = new Schema<UserFeedbackDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ["bug-report", "feature-request", "suggestion", "other"],
      required: true,
      default: "bug-report"
    },
    userBugReport: {
      type: String,
      maxlength: 2000,
    },
    userFeatureRequest: {
      type: String,
      maxlength: 2000,
    },
    userSuggestion: {
      type: String,
      maxlength: 2000,
    },
    userOther: {
      type: String,
      maxlength: 2000,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
      required: true,
    },
    messages: [
      new Schema<UserFeedbackMessage>(
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
userFeedbackSchema.index({ userId: 1 }, { unique: false });

const UserFeedbackModel = mongoose.model<UserFeedbackDocument>("UserFeedback", userFeedbackSchema);
export default UserFeedbackModel;
