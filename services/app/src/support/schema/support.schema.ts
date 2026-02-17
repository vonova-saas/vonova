import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type SupportDocument = Support & Document;

@Schema({ timestamps: true })
export class Support {
  @Prop({ ref: 'User', required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    required: true,
    enum: ['technical', 'billing', 'general', 'feature-request', 'bug-report'],
  })
  category: string;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true, maxlength: 2000 })
  message: string;

  @Prop({ default: 'open', enum: ['open', 'pending', 'resolved', 'closed'] })
  status: string;

  @Prop({ type: [{ sender: String, message: String, createdAt: Date }] })
  messages: any[];
}

export const SupportSchema = SchemaFactory.createForClass(Support);
