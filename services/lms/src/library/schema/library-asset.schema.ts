import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LibraryAssetDocument = LibraryAsset & Document;

export type LibraryAssetStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED';

export type LibraryAssetType = 'BOOK' | 'GUIDE' | 'PRESENTATION';
export type LibraryAssetProvider = 'S3' | 'BUNNY';

export class LibraryAssetUrls {
  @Prop()
  sourceUrl?: string;

  @Prop()
  streamUrl?: string;

  @Prop()
  posterUrl?: string;

  @Prop({ type: [String], default: [] })
  previewThumbnails?: string[];

  @Prop()
  presignedUrl?: string;

  @Prop()
  presignedUrlExpiresAt?: Date;
}

@Schema({ timestamps: true })
export class LibraryAsset {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    enum: ['BOOK', 'GUIDE', 'PRESENTATION'],
    required: true,
    index: true,
  })
  itemType: LibraryAssetType;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  itemId: Types.ObjectId;

  @Prop({ enum: ['S3', 'BUNNY'], default: 'S3' })
  provider: LibraryAssetProvider;

  @Prop({ required: true })
  objectKey: string;

  @Prop({ required: true })
  originalFileName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop()
  size?: number;

  @Prop({
    enum: ['PENDING', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
    default: 'PENDING',
  })
  status: LibraryAssetStatus;

  @Prop({ type: LibraryAssetUrls, default: {} })
  urls: LibraryAssetUrls;
}

export const LibraryAssetSchema = SchemaFactory.createForClass(LibraryAsset);
LibraryAssetSchema.index({ itemType: 1, itemId: 1 });
