import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstructorPayoutDocument = InstructorPayout & Document;

/**
 * Payout Status Enum
 */
export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Instructor Payout Schema
 * 
 * Tracks instructor earnings and payouts via Stripe Connect
 */
@Schema({ timestamps: true })
export class InstructorPayout {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId: Types.ObjectId;

  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  // Stripe Connect Account
  @Prop({ type: String, required: true })
  stripeConnectAccountId: string;

  // Earnings Breakdown
  @Prop({ type: Number, required: true })
  totalAmount: number; // In cents

  @Prop({ type: Number, default: 0 })
  platformFee: number; // In cents

  @Prop({ type: Number, required: true })
  instructorAmount: number; // In cents (net payout)

  @Prop({ type: Number, default: 30 })
  commissionPercent: number; // e.g., 30% platform fee

  // Associated Payments
  @Prop([{ type: Types.ObjectId, ref: 'Payment' }])
  paymentIds: Types.ObjectId[];

  // Payout Details
  @Prop({ type: String, unique: true, sparse: true })
  stripePayoutId: string;

  @Prop({ type: String, unique: true, sparse: true })
  stripeTransferId: string;

  @Prop({ type: Date })
  payoutDate: Date;

  @Prop({ type: Date })
  periodStart: Date;

  @Prop({ type: Date })
  periodEnd: Date;

  // Bank/Destination Info (last 4 digits only for security)
  @Prop({ type: String })
  destinationLast4: string;

  @Prop({ type: String })
  destinationBankName: string;

  // Failure Reason
  @Prop({ type: String })
  failureCode: string;

  @Prop({ type: String })
  failureMessage: string;

  // Balance Tracking (for wallet system)
  @Prop({ type: Number, default: 0 })
  availableBalance: number; // Current available balance

  @Prop({ type: Number, default: 0 })
  pendingBalance: number; // Pending balance (in transit)

  @Prop({ type: Number, default: 0 })
  lifetimeEarnings: number; // Total all-time earnings

  // Metadata
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const InstructorPayoutSchema = SchemaFactory.createForClass(InstructorPayout);

// Indexes for earnings queries
InstructorPayoutSchema.index({ instructorId: 1, status: 1, createdAt: -1 });
InstructorPayoutSchema.index({ instructorId: 1, periodStart: 1, periodEnd: 1 });
InstructorPayoutSchema.index({ stripeConnectAccountId: 1 });
InstructorPayoutSchema.index({ stripePayoutId: 1 });
InstructorPayoutSchema.index({ status: 1, payoutDate: 1 });

// Index for balance calculations
InstructorPayoutSchema.index({ instructorId: 1, status: 1, payoutDate: -1 });
