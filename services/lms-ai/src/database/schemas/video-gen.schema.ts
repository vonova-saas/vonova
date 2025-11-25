import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoGenDocument = VideoGen & Document;

@Schema({
  collection: 'VIDEO_GEN',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class VideoGen {
  @Prop({ required: true, unique: true, index: true })
  videoId: string;

  @Prop({ type: String, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  video_url: string;

  @Prop()
  thumbnail_url: string;

  @Prop({
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Prop({ default: 'gemini' })
  ai_model_used: string;

  @Prop({ default: 0 })
  duration_seconds: number;

  @Prop({ default: 0 })
  processing_time_ms: number;

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

export const VideoGenSchema = SchemaFactory.createForClass(VideoGen);

// Indexes for better query performance
VideoGenSchema.index({ userId: 1, created_at: -1 });
VideoGenSchema.index({ status: 1, created_at: -1 });
VideoGenSchema.index({ ai_model_used: 1, created_at: -1 });

