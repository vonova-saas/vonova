import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoiceAskIdempotencyDocument = VoiceAskIdempotency & Document;

@Schema({
  collection: 'VOICE_ASK_IDEMPOTENCY',
  timestamps: false,
})
export class VoiceAskIdempotency {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true, enum: ['processing', 'completed'] })
  status: 'processing' | 'completed';

  @Prop({ type: Object })
  response?: Record<string, unknown>;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop()
  updated_at?: Date;
}

export const VoiceAskIdempotencySchema =
  SchemaFactory.createForClass(VoiceAskIdempotency);

VoiceAskIdempotencySchema.index({ created_at: 1 }, { expireAfterSeconds: 300 });
