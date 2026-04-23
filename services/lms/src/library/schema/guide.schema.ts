import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { LibraryStatus, Level } from './library.schema';
import { LibraryTopics } from './library.schema';

export class Author {
  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl?: string;
}

export class GuideMetrics {
  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  favoritesCount: number;

  @Prop({ default: 0 })
  ratingAverage: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

@Schema({ timestamps: true })
export class Guide {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true, unique: true, index: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  summary?: string;

  @Prop()
  description?: string;

  @Prop({ type: [Object], default: [] })
  authors: Author[];

  @Prop({ type: [String], enum: Object.values(LibraryTopics), default: [] })
  topics: string[];

  @Prop({ enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' })
  level?: Level;

  @Prop()
  coverUrl?: string;

  @Prop({ default: 'en' })
  language?: string;

  @Prop({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' })
  status: LibraryStatus;

  @Prop({ type: Object, default: {} })
  metrics: GuideMetrics;

  @Prop({ type: [String], default: [] })
  badges?: string[];

  @Prop({ type: Types.ObjectId, ref: 'LibraryAsset', default: null })
  fileAssetId?: Types.ObjectId | null;

  @Prop({ enum: ['book', 'guide', 'presentation'], default: 'guide' })
  type: string;
}

export type GuideDocument = Guide & Document;
export const GuideSchema = SchemaFactory.createForClass(Guide);
GuideSchema.index({ title: 'text', summary: 'text', description: 'text' });
