import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PdfSummaryDocument = PdfSummary & Document;

@Schema({
  collection: 'PDF_SUMMARY',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PdfSummary {
  @Prop({ required: true, unique: true, index: true })
  summaryId: string;

  @Prop({ required: true })
  session_id: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  original_filename: string;

  @Prop({
    required: true,
    enum: ['brief', 'detailed', 'comprehensive'],
    index: true,
  })
  summary_type: 'brief' | 'detailed' | 'comprehensive';

  @Prop({ required: true, type: String })
  summary_content: string;

  @Prop({ required: true })
  file_size_bytes: number;

  @Prop({ required: true })
  total_pages: number;

  @Prop({ required: true, index: true })
  file_hash: string;

  @Prop({ default: 'gemini' })
  ai_model_used: string;

  @Prop({ default: 0 })
  processing_time_ms: number;

  @Prop({ default: 1 })
  chunks_processed: number;

  @Prop({ type: String, index: true })
  user_id: string;

  @Prop({
    enum: ['processing', 'completed', 'failed'],
    default: 'completed',
    index: true,
  })
  status: 'processing' | 'completed' | 'failed';

  @Prop({ type: String })
  s3_key: string;

  @Prop({ type: String })
  s3_url: string;

  @Prop({ type: String })
  language: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const PdfSummarySchema = SchemaFactory.createForClass(PdfSummary);

// Indexes for better query performance
PdfSummarySchema.index({ session_id: 1 });
PdfSummarySchema.index({ user_id: 1, created_at: -1 });
PdfSummarySchema.index({ file_hash: 1, summary_type: 1 });
PdfSummarySchema.index({ status: 1, created_at: -1 });
