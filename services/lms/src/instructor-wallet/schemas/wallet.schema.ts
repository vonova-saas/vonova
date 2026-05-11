import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

/**
 * Wallet Schema
 * 
 * Real-time wallet balances for instructors.
 * Updated via aggregation pipeline or webhooks.
 */
@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  instructorId: Types.ObjectId;

  // Real-time Balances
  @Prop({ type: Number, default: 0 })
  totalEarnings: number; // All-time earnings (cents)

  @Prop({ type: Number, default: 0 })
  availableBalance: number; // Ready to withdraw (cents)

  @Prop({ type: Number, default: 0 })
  pendingBalance: number; // Pending clearance (cents)

  @Prop({ type: Number, default: 0 })
  withdrawnAmount: number; // Total withdrawn (cents)

  @Prop({ type: Number, default: 0 })
  refundedAmount: number; // Total refunds (cents)

  // Commission Tracking
  @Prop({ type: Number, default: 0 })
  platformCommission: number; // Total platform fees paid (cents)

  @Prop({ type: Number, default: 0 })
  processingFees: number; // Stripe fees paid (cents)

  // Sales Metrics
  @Prop({ type: Number, default: 0 })
  totalSales: number; // Number of completed sales

  @Prop({ type: Number, default: 0 })
  totalRefunds: number; // Number of refunds

  // Last Calculated
  @Prop({ type: Date })
  lastCalculatedAt: Date;

  @Prop({ type: String })
  lastCalculationMethod: 'realtime' | 'scheduled' | 'manual';

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes
WalletSchema.index({ instructorId: 1 });
WalletSchema.index({ availableBalance: 1 }); // Find instructors with withdrawable balance
WalletSchema.index({ updatedAt: -1 }); // Recently updated wallets
