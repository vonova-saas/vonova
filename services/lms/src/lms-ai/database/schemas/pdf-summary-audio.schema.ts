import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PdfSummaryAudioDocument = PdfSummaryAudio & Document;

@Schema({
  collection: 'PDF_SUMMARY_AUDIO',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PdfSummaryAudio {
  @Prop({ required: true, unique: true, index: true })
  audioId: string;

  @Prop({ required: true, index: true })
  session_id: string;

  @Prop({ type: String, index: true })
  user_id?: string;

  @Prop({ type: String })
  user_audio_s3_key?: string;

  @Prop({ type: String })
  user_audio_s3_url?: string;

  @Prop({ type: String })
  user_audio_mime_type?: string;

  @Prop({ type: String })
  ai_audio_s3_key?: string;

  @Prop({ type: String })
  ai_audio_s3_url?: string;

  @Prop({ type: String })
  ai_audio_content_type?: string;

  @Prop({ type: String })
  detected_language?: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const PdfSummaryAudioSchema =
  SchemaFactory.createForClass(PdfSummaryAudio);

PdfSummaryAudioSchema.index({ session_id: 1, created_at: -1 });
PdfSummaryAudioSchema.index({ user_id: 1, created_at: -1 });
