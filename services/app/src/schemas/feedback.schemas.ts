import { Schema, Document } from 'mongoose';

export const MessageSchema = new Schema(
  {
    sender: { type: String, enum: ['user', 'agent'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const UserFeedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    feedbackType: {
      type: String,
      enum: ['bug-report', 'feature-request', 'suggestion', 'other'],
      default: 'bug-report',
    },
    userBugReport: { type: String, maxlength: 2000 },
    userFeatureRequest: { type: String, maxlength: 2000 },
    userSuggestion: { type: String, maxlength: 2000 },
    userOther: { type: String, maxlength: 2000 },
    email: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
    },
    messages: [MessageSchema],
  },
  { timestamps: true },
);

export interface UserFeedback {
  userId: Schema.Types.ObjectId;
  feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
  userBugReport?: string;
  userFeatureRequest?: string;
  userSuggestion?: string;
  userOther?: string;
  email?: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  messages: Array<{
    sender: 'user' | 'agent';
    message: string;
    createdAt: Date;
  }>;
}

export type UserFeedbackDocument = UserFeedback & Document;
