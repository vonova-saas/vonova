import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PdfChatHistoryDocument = PdfChatHistory & Document;

@Schema({
  collection: 'PDF_SUMMARY_CHAT',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class PdfChatHistory {
  @Prop({ required: true, unique: true, index: true })
  chatId: string;

  @Prop({ required: true })
  session_id: string;

  @Prop({ type: String, index: true })
  user_id: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true, type: String })
  answer: string;

  @Prop({
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  })
  ai_wizard_status: 'active' | 'inactive' | 'error';

  @Prop({
    enum: ['normal', 'enhanced', 'cached'],
    default: 'normal'
  })
  magic_level: 'normal' | 'enhanced' | 'cached';

  @Prop({ default: 'gemini' })
  ai_model_used: string;

  @Prop({ default: 0 })
  response_time_ms: number;

  @Prop({ default: 0 })
  tokens_used: number;

  @Prop({ min: 1, max: 5 })
  rating: number;

  @Prop()
  ip_address: string;

  @Prop()
  user_agent: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const PdfChatHistorySchema = SchemaFactory.createForClass(PdfChatHistory);

// Indexes for better query performance
PdfChatHistorySchema.index({ session_id: 1, created_at: -1 });
PdfChatHistorySchema.index({ user_id: 1, created_at: -1 });
PdfChatHistorySchema.index({ filename: 1, created_at: -1 });
PdfChatHistorySchema.index({ rating: 1 });
PdfChatHistorySchema.index({ ai_model_used: 1, created_at: -1 });
