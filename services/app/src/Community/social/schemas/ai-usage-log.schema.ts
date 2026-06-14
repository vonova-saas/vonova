import { Schema } from 'mongoose';

export const AiFeatureKey = [
  'PDF_CHAT',
  'PDF_SUMMARY',
  'QUIZ_GENERATION',
  'ARTICLE_GENERATION',
  'MINDMAP_GENERATION',
] as const;

export const AiUsageLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    feature: { type: String, enum: AiFeatureKey, required: true, index: true },
    creditsUsed: { type: Number, default: 1, min: 0 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

AiUsageLogSchema.index({ userId: 1, feature: 1, createdAt: -1 });
