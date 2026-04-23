import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LibraryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type LibraryType = 'book' | 'guide' | 'presentation';

export enum LibraryTopics {
  PROGRAMMING_BASICS = 'Programming Basics',
  WEB_DEVELOPMENT = 'Web Development',
  DATA_STRUCTURE = 'Data Structure',
  ALGORITHMS = 'Algorithms',
  DATABASE_DESIGN = 'Database Design',
  MACHINE_LEARNING = 'Machine Learning',
  MOBILE_DEVELOPMENT = 'Mobile Development',
  CLOUD_COMPUTING = 'Cloud Computing',
}

export class Author {
  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl?: string;
}

export class LibraryMetrics {
  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  favoritesCount: number;

  @Prop({ default: 0 })
  ratingAverage: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

@Schema({ timestamps: true, discriminatorKey: 'type' })
export class LibraryItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  summary?: string;

  @Prop()
  description?: string;

  @Prop({ type: [Object], default: [] })
  authors: Author[];

  @Prop({ type: [String], default: [] })
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
  metrics: LibraryMetrics;

  @Prop({ type: [String], default: [] })
  badges?: string[];

  @Prop({ type: Types.ObjectId, ref: 'LibraryAsset', default: null })
  fileAssetId?: Types.ObjectId | null;

  @Prop({ enum: ['book', 'guide', 'presentation'], required: true })
  type: LibraryType;
}

export const LibrarySchema = SchemaFactory.createForClass(LibraryItem);
LibrarySchema.index({ title: 'text', summary: 'text', description: 'text' });

export type LibraryDocument = LibraryItem & Document;
