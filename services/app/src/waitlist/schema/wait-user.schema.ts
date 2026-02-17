import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum WaitUserStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class WaitUser extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  promoCode: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ required: true, default: false })
  used: boolean;

  @Prop({ enum: WaitUserStatus, default: WaitUserStatus.PENDING })
  status: WaitUserStatus;
}

export type WaitUserDocument = WaitUser & Document;
export const WaitUserSchema = SchemaFactory.createForClass(WaitUser);

// Indexes for better performance
WaitUserSchema.index({ email: 1 });
WaitUserSchema.index({ promoCode: 1 });
WaitUserSchema.index({ email: 1, promoCode: 1 });
WaitUserSchema.index({ expiresAt: 1 });
WaitUserSchema.index({ used: 1 });
