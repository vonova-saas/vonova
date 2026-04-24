import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeatureUsageDocument = FeatureUsage & Document;

@Schema({
  collection: 'feature_usages',
  timestamps: true,
})
export class FeatureUsage {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['ai_roadmap', 'pdf_summary', 'pdf_voice'],
    index: true,
  })
  feature: 'ai_roadmap' | 'pdf_summary' | 'pdf_voice';

  @Prop({ required: true, default: 0 })
  usedCount: number;

  @Prop({ default: null })
  limitCount: number | null;

  // Future-ready for duration-based limits (e.g., voice minutes/day)
  @Prop({ required: true, enum: ['count', 'minutes'], default: 'count' })
  usageUnit: 'count' | 'minutes';

  @Prop({ required: true, default: 0 })
  usedDurationMinutes: number;

  @Prop({ default: null })
  limitDurationMinutes: number | null;

  @Prop({ required: true, index: true })
  date: string;
}

export const FeatureUsageSchema = SchemaFactory.createForClass(FeatureUsage);

FeatureUsageSchema.index({ userId: 1, feature: 1, date: 1 }, { unique: true });
