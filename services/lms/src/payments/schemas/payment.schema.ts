import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

/**
 * Payment Type Enum
 */
export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  COURSE_PURCHASE = 'course_purchase',
  MATERIAL_PURCHASE = 'material_purchase',
  SUBSCRIPTION_UPGRADE = 'subscription_upgrade',
}

/**
 * Payment Schema
 * 
 * Tracks all payments in the system:
 * - SaaS subscriptions
 * - Course purchases
 * - Material purchases
 * - Refunds
 */
@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: PaymentType, required: true })
  type: PaymentType;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: Number, required: true })
  amount: number; // In cents

  @Prop({ type: String, default: 'usd' })
  currency: string;

  @Prop({ type: String })
  description: string;

  // Stripe Fields
  @Prop({ type: String, index: true })
  stripeCustomerId: string;

  @Prop({ type: String, index: true })
  stripePaymentIntentId: string;

  @Prop({ type: String, index: true })
  stripeChargeId: string;

  @Prop({ type: String })
  stripeInvoiceId: string;

  @Prop({ type: String })
  stripeSubscriptionId: string;

  @Prop({ type: String })
  stripeCheckoutSessionId: string;

  @Prop({ type: String })
  stripePriceId: string;

  // For marketplace purchases (courses/materials)
  @Prop({ type: Types.ObjectId, ref: 'Course', index: true })
  courseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', index: true })
  materialId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  instructorId?: Types.ObjectId; // For marketplace commission tracking

  // Revenue Split (for marketplace)
  @Prop({ type: Number, default: 0 })
  platformFee: number; // In cents

  @Prop({ type: Number, default: 0 })
  instructorPayout: number; // In cents

  @Prop({ type: Number, default: 30 })
  platformFeePercent: number; // e.g., 30%

  // Subscription Details
  @Prop({ type: String, enum: ['monthly', 'yearly'] })
  subscriptionInterval?: string;

  @Prop({ type: Date })
  currentPeriodStart?: Date;

  @Prop({ type: Date })
  currentPeriodEnd?: Date;

  // Metadata
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: String })
  failureMessage?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Date })
  refundedAt?: Date;

  @Prop({ type: Number, default: 0 })
  refundAmount?: number;

  // Idempotency
  @Prop({ type: String, unique: true, sparse: true })
  idempotencyKey?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes for common queries
PaymentSchema.index({ userId: 1, status: 1, createdAt: -1 }); // User payment history
PaymentSchema.index({ stripePaymentIntentId: 1 }); // Webhook lookups
PaymentSchema.index({ stripeCustomerId: 1 }); // Customer lookups
PaymentSchema.index({ courseId: 1, status: 1 }); // Course revenue
PaymentSchema.index({ materialId: 1, status: 1 }); // Material revenue
PaymentSchema.index({ instructorId: 1, status: 1, createdAt: -1 }); // Instructor earnings
PaymentSchema.index({ type: 1, status: 1, createdAt: -1 }); // Revenue reports

// TTL index for old pending payments (7 days)
PaymentSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 604800,
    partialFilterExpression: { status: PaymentStatus.PENDING }
  }
);
