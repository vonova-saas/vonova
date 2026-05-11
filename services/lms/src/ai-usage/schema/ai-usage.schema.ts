import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIFeature =
  | 'ARTICLE_GENERATION'
  | 'PDF_SUMMARY'
  | 'ROADMAP_GENERATION'
  | 'VOICE_CHAT'
  | 'QUIZ_GENERATION'
  | 'PROBLEM_SOLVING';

export interface AIUsageDocument extends Document {
  userId: Types.ObjectId;
  feature: AIFeature;
  featureName: AIFeature;
  count: number;
  usedCount: number;
  limitCount: number;
  remainingCount: number;
  date: Date;
  dateKey: string;
  planType: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class AIUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['ARTICLE_GENERATION', 'PDF_SUMMARY', 'ROADMAP_GENERATION', 'VOICE_CHAT', 'QUIZ_GENERATION', 'PROBLEM_SOLVING'],
    required: true,
    index: true
  })
  feature: AIFeature;

  @Prop({ type: Number, default: 0 })
  count: number;

  @Prop({ type: Number, default: 0 })
  usedCount: number;

  @Prop({ type: Number, default: 1 })
  limitCount: number;

  @Prop({ type: Number, default: 1 })
  remainingCount: number;

  @Prop({ type: String, default: 'free' })
  planType: string;

  @Prop({ type: String, required: true, index: true })
  dateKey: string;

  @Prop({ type: Date, required: true, index: true })
  date: Date;
}

export const AIUsageSchema = SchemaFactory.createForClass(AIUsage);
AIUsageSchema.index({ userId: 1, feature: 1, date: 1 }, { unique: true });
