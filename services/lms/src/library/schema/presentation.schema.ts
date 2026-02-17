
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LibraryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export class Author {
  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl?: string;
}

export class PresentationMetrics {
  @Prop({ default: 0 }) views: number;
  @Prop({ default: 0 }) favoritesCount: number;
  @Prop({ default: 0 }) ratingAverage: number;
  @Prop({ default: 0 }) ratingCount: number;
}

@Schema({ timestamps: true })
export class Presentation extends Document {
  @Prop({ required: true }) title: string;
  @Prop({ required: true, unique: true, index: true }) slug: string;
  @Prop() summary?: string;
  @Prop() description?: string;

  @Prop({ type: [{ name: String, avatarUrl: String }], default: [] })
  authors: Author[];

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  })
  level: Level;

  @Prop() coverUrl?: string;
  @Prop({ default: 'en' }) language?: string;

  @Prop({
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT',
  })
  status: LibraryStatus;

  @Prop({ type: PresentationMetrics, default: {} })
  metrics: PresentationMetrics;

  @Prop({ type: [String], default: [] })
  badges?: string[];

  @Prop({ type: Types.ObjectId, ref: 'LibraryAsset', default: null })
  fileAssetId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const PresentationSchema = SchemaFactory.createForClass(Presentation);
PresentationSchema.index({ title: 'text', summary: 'text', description: 'text' });
