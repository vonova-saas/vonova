import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

/**
 * Subscription Status Enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAUSED = 'paused',
}

/**
 * Subscription Tier Enum
 */
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  STARTUP = 'startup',
}

/**
 * Subscription Interval
 */
export enum SubscriptionInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Subscription Schema
 * 
 * Tracks user SaaS subscriptions
 */
@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.INCOMPLETE })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: SubscriptionTier, default: SubscriptionTier.FREE })
  tier: SubscriptionTier;

  @Prop({ type: String, enum: SubscriptionInterval })
  interval: SubscriptionInterval;

  // Stripe Fields
  @Prop({ type: String, unique: true, sparse: true })
  stripeCustomerId: string;

  @Prop({ type: String, unique: true, sparse: true })
  stripeSubscriptionId: string;

  @Prop({ type: String })
  stripePriceId: string;

  // Billing Period
  @Prop({ type: Date })
  currentPeriodStart: Date;

  @Prop({ type: Date })
  currentPeriodEnd: Date;

  @Prop({ type: Date })
  trialStart: Date;

  @Prop({ type: Date })
  trialEnd: Date;

  // Cancellation
  @Prop({ type: Boolean, default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop({ type: Date })
  endedAt: Date;

  // Usage Tracking
  @Prop({ type: Number, default: 0 })
  amountPaid: number; // Total amount paid (in cents)

  @Prop({ type: String })
  currency: string;

  // Plan Limits (cached at subscription level)
  @Prop({ type: Object })
  planLimits: {
    roadmapGeneration: number;
    pdfSummaries: number;
    voiceChats: number;
    storageGB: number;
  };

  // Metadata
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ status: 1, tier: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 }); // For expiring subscription notifications
SubscriptionSchema.index({ trialEnd: 1 }); // For trial ending notifications
