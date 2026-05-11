import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LimitHitEventDocument = AIUsageAnalytics & Document;

/**
 * AI Usage Analytics Schema
 * Tracks monetization events for conversion optimization
 */
@Schema({ timestamps: true })
export class AIUsageAnalytics {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['ROADMAP_GENERATION', 'PDF_SUMMARY', 'VOICE_CHAT', 'ARTICLE_GENERATION', 'QUIZ_GENERATION', 'PROBLEM_SOLVING'],
    required: true,
    index: true,
  })
  feature: string;

  @Prop({
    type: String,
    enum: ['FREE', 'PRO', 'STARTUP'],
    required: true,
    index: true,
  })
  planType: string;

  @Prop({ type: String, required: true, index: true })
  dateKey: string; // YYYY-MM-DD format

  @Prop({ type: Number, default: 0 })
  limitHitCount: number; // How many times user hit the limit today

  @Prop({ type: Number, default: 0 })
  upgradeClickCount: number; // How many times they clicked upgrade

  @Prop({ type: Boolean, default: false })
  upgradedAfterHit: boolean; // Did they upgrade after hitting limit?

  @Prop({ type: Date })
  upgradedAt: Date;

  @Prop({ type: String })
  upgradeSource: string; // Which feature triggered upgrade

  @Prop({ type: Number, default: 0 })
  totalRequests: number; // Total API calls today

  @Prop({ type: Number, default: 0 })
  blockedRequests: number; // Requests that returned 429

  @Prop({ type: Object })
  offerShown: {
    offerId: string;
    discountPercent: number;
    shownAt: Date;
    claimed: boolean;
    claimedAt?: Date;
  };

  @Prop({ type: Date })
  trialStartedAt: Date;

  @Prop({ type: Date })
  trialEndsAt: Date;

  @Prop({ type: Boolean, default: false })
  trialConverted: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AIUsageAnalyticsSchema = SchemaFactory.createForClass(AIUsageAnalytics);

// Compound indexes for analytics queries
AIUsageAnalyticsSchema.index({ userId: 1, feature: 1, dateKey: 1 }, { unique: true });
AIUsageAnalyticsSchema.index({ dateKey: 1, planType: 1, feature: 1 }); // Daily aggregation
AIUsageAnalyticsSchema.index({ upgradedAfterHit: 1, dateKey: 1 }); // Conversion tracking
AIUsageAnalyticsSchema.index({ offerShown: 1, dateKey: 1 }); // Offer effectiveness

// TTL index - keep analytics for 2 years
AIUsageAnalyticsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 63072000 }
);
