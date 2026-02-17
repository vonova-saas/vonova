import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssetDocument = Asset & Document;

@Schema({ _id: false })
export class AssetUrls {
  @Prop() sourceUrl?: string;
  @Prop() streamUrl?: string;
  @Prop() posterUrl?: string;
  @Prop() captionsUrl?: string;
}

export const AssetUrlsSchema = SchemaFactory.createForClass(AssetUrls);

@Schema({ timestamps: true })
export class Asset {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: Types.ObjectId;

  @Prop({ default: 'S3' })
  provider: 'S3';

  @Prop({ required: true })
  objectKey: string;

  @Prop({ required: true })
  originalFileName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop() size?: number;

  @Prop({
    type: String,
    enum: ['PENDING', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
    default: 'PENDING',
  })
  status: string;

  @Prop({ type: AssetUrlsSchema, default: {} })
  urls: AssetUrls;

  @Prop({ type: Object })
  processing?: { jobId?: string; error?: string };
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
