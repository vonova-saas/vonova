import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { LibraryStatus, Level } from '../library.schema';
import { LibraryTopics } from '../library.schema';

export class Author {
  name: string;
  avatarUrl?: string;
}

export class BookMetrics {
  views: number;
  favoritesCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
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

  @Prop({ type: [{ name: String, avatarUrl: String }], default: [] })
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

  @Prop({
    type: {
      views: Number,
      favoritesCount: Number,
      ratingAverage: Number,
      ratingCount: Number,
    },
    default: {},
  })
  metrics: BookMetrics;

  @Prop({ type: [String], default: [] })
  badges?: string[];

  @Prop({ type: Types.ObjectId, ref: 'LibraryAsset', default: null })
  fileAssetId?: Types.ObjectId | null;

  @Prop({ default: 0 })
  pageCount?: number;

  @Prop({ default: 0 })
  readingTimeMin?: number;

  @Prop({ enum: ['book', 'guide', 'presentation'], default: 'book' })
  type: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.index({ title: 'text', summary: 'text', description: 'text' });
