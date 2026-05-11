import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'SUBSCRIPTION' | 'COURSE' | 'MATERIAL';
export type PaymentProvider = 'STRIPE' | 'PAYPAL';

export interface PaymentDocument extends Document {
  userId: Types.ObjectId;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId?: string;
  description: string;
  metadata?: Record<string, any>;
  courseId?: Types.ObjectId;
  materialId?: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['SUBSCRIPTION', 'COURSE', 'MATERIAL'], required: true })
  type: PaymentType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' })
  status: PaymentStatus;

  @Prop({ type: String, enum: ['STRIPE', 'PAYPAL'], required: true })
  provider: PaymentProvider;

  @Prop({ type: String })
  providerPaymentId?: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material' })
  materialId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId?: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
