import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ ref: 'User', required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['bug-report', 'feature-request', 'suggestion', 'other'],
    default: 'bug-report',
  })
  feedbackType: string;

  @Prop({ type: String, maxlength: 2000 })
  userBugReport: string;

  @Prop({ type: String, maxlength: 2000 })
  userFeatureRequest: string;

  @Prop({ type: String, maxlength: 2000 })
  userSuggestion: string;

  @Prop({ type: String, maxlength: 2000 })
  userOther: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, maxlength: 2000 })
  message: string;

  @Prop({ default: 'open', enum: ['open', 'pending', 'resolved', 'closed'] })
  status: string;

  @Prop({ type: [{ sender: String, message: String, createdAt: Date }] })
  messages: any[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
