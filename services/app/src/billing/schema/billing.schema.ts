import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true, minimize: false })
export class UserBilling {
  @Prop({ ref: 'User', required: true, unique: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, trim: true })
  plan?: string;

  @Prop({ type: String, trim: true, unique: true })
  cardNumber?: string;

  @Prop({ type: String })
  nameOfCard?: string;

  @Prop({ type: String })
  expiryDate?: string;

  @Prop({ type: String })
  cvv?: string;

  @Prop({ type: String })
  billingEmail?: string;

  @Prop({ maxlength: 500 })
  cardAddress?: string;

  @Prop({ type: String })
  city?: string;

  @Prop({ type: String })
  country?: string;

  @Prop({ type: String })
  zipCode?: string;
}

export const UserBillingSchema = SchemaFactory.createForClass(UserBilling);
