import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, minimize: false })
export class UserBilling extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ trim: true })
  plan?: string;

  @Prop({ trim: true, unique: true })
  cardNumber?: string;

  @Prop()
  nameOfCard?: string;

  @Prop()
  expiryDate?: string;

  @Prop()
  cvv?: string;

  @Prop()
  billingEmail?: string;

  @Prop({ maxlength: 500 })
  cardAddress?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  zipCode?: string;
}

export type UserBillingDocument = UserBilling & Document;
export const UserBillingSchema = SchemaFactory.createForClass(UserBilling);
