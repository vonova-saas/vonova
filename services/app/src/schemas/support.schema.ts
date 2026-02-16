import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserSupport {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({
    required: true,
    enum: ['technical', 'billing', 'general', 'feature-request', 'bug-report'],
  })
  category: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true, maxlength: 2000 })
  message: string;

  @Prop({ default: 'open', enum: ['open', 'pending', 'resolved', 'closed'] })
  status: string;

  @Prop({ type: [{ sender: String, message: String, createdAt: Date }] })
  messages: any[];
}

export type UserSupportDocument = UserSupport & Document;
export const UserSupportSchema = SchemaFactory.createForClass(UserSupport);
