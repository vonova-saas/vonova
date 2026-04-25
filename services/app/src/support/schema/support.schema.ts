import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type SupportDocument = Support & Document;

/** One thread entry; `sender: 'admin'` includes display metadata from the platform Admin account. */
@Schema({ _id: false })
export class SupportMessageSubdoc {
  @Prop({ type: String, required: true })
  sender: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: String, required: false })
  senderName?: string;

  @Prop({ type: String, required: false, default: null })
  senderAvatarUrl?: string | null;
}

const SupportMessageSubdocSchema = SchemaFactory.createForClass(SupportMessageSubdoc);

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

  @Prop({ type: [SupportMessageSubdocSchema], default: [] })
  messages: SupportMessageSubdoc[];
}

export const SupportSchema = SchemaFactory.createForClass(Support);
