import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AiAssistantDocument = AiAssistant & Document;

@Schema({
  collection: 'AI_ASSISTANT',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class AiAssistant {
  @Prop({ required: true, unique: true, index: true })
  assistantId: string;

  @Prop({ type: String, index: true })
  userId: string;

  @Prop({ required: true })
  session_id: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, type: String })
  response: string;

  @Prop({ default: 'gemini' })
  ai_model_used: string;

  @Prop({ default: 0 })
  response_time_ms: number;

  @Prop({ default: 0 })
  tokens_used: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ip_address: string;

  @Prop()
  user_agent: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const AiAssistantSchema = SchemaFactory.createForClass(AiAssistant);

// Indexes for better query performance
AiAssistantSchema.index({ userId: 1, created_at: -1 });
AiAssistantSchema.index({ session_id: 1, created_at: -1 });
AiAssistantSchema.index({ ai_model_used: 1, created_at: -1 });

