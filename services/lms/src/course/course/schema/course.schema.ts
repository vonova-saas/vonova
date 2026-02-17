
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export class CoursePrice {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, default: false })
  isFree: boolean;
}

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  smallDescription?: string;

  @Prop()
  description?: string;

  @Prop()
  difficulty?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  categoryId?: Types.ObjectId | null;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  trailerUrl?: string;

  @Prop({ default: 'en' })
  language?: string;

  @Prop({ default: 0 })
  durationMinutes?: number;

  @Prop({ default: 0 })
  totalLessons?: number;

  @Prop({ default: 0 })
  averageRating?: number;

  @Prop({ default: 0 })
  ratingCount?: number;

  @Prop({ type: CoursePrice, required: true })
  price: CoursePrice;

  @Prop({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' })
  status: CourseStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;
}

export type CourseDocument = Course & Document;

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.set('validateBeforeSave', false);
CourseSchema.index({ title: 'text', smallDescription: 'text', description: 'text' });
