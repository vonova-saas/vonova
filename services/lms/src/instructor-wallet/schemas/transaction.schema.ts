import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

/**
 * Transaction Type Enum
 */
export enum TransactionType {
  COURSE_SALE = 'course_sale',
  MATERIAL_SALE = 'material_sale',
  REFUND = 'refund',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
  PLATFORM_FEE = 'platform_fee',
}

/**
 * Transaction Status Enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Transaction Schema
 * 
 * Records all financial activity for instructors.
 * Supports both marketplace sales and payouts.
 */
@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  studentId?: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ type: Types.ObjectId, ref: 'Course', index: true })
  courseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', index: true })
  materialId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', index: true })
  paymentId?: Types.ObjectId;

  // Financial Breakdown
  @Prop({ type: Number, required: true })
  grossAmount: number; // Total sale amount (cents)

  @Prop({ type: Number, required: true })
  netAmount: number; // Instructor's earnings after fees (cents)

  @Prop({ type: Number, required: true })
  platformFee: number; // Platform commission (cents)

  @Prop({ type: Number, default: 30 })
  platformFeePercent: number; // e.g., 30%

  @Prop({ type: Number, default: 0 })
  processingFee: number; // Stripe processing fee (cents)

  @Prop({ type: Number, default: 0 })
  refundAmount: number; // If partial refund (cents)

  @Prop({ type: String })
  currency: string;

  // Payout Reference
  @Prop({ type: Types.ObjectId, ref: 'InstructorPayout' })
  payoutId?: Types.ObjectId;

  @Prop({ type: String })
  stripeTransferId?: string;

  @Prop({ type: String })
  stripePayoutId?: string;

  // Metadata
  @Prop({ type: String })
  description?: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  settledAt?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Performance indexes for wallet queries
TransactionSchema.index({ instructorId: 1, createdAt: -1 }); // Recent transactions
TransactionSchema.index({ instructorId: 1, type: 1, status: 1 }); // Filtered by type
TransactionSchema.index({ instructorId: 1, courseId: 1, status: 1 }); // Course earnings
TransactionSchema.index({ instructorId: 1, payoutId: 1 }); // Payout grouping
TransactionSchema.index({ paymentId: 1 }); // Lookup by payment
TransactionSchema.index({ stripeTransferId: 1 }); // Stripe reconciliation
TransactionSchema.index({ createdAt: -1 }); // Global date sorting
TransactionSchema.index({ instructorId: 1, settledAt: 1 }); // Unsettled transactions

// Compound index for analytics
TransactionSchema.index({ instructorId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ instructorId: 1, status: 1, paidAt: -1 });
