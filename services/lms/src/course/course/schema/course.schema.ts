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

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop()
  thumbnailUrl?: string;

  /** S3 object key for thumbnail (used to issue presigned GET URLs). */
  @Prop({ index: true })
  thumbnailKey?: string;

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

  @Prop()
  publishedAt?: Date;

  @Prop({
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    default: 'BEGINNER',
    index: true,
  })
  level?: string;

  @Prop({
    type: String,
    enum: [
      'PROGRAMMING_BASICS',
      'WEB_DEVELOPMENT',
      'FRONTEND',
      'BACKEND',
      'FULLSTACK',
      'FLUTTER',
      'MOBILE',
      'AI',
      'DATA_SCIENCE',
      'CYBER_SECURITY',
      'DEVOPS',
      'UI_UX',
      'DATABASE',
      'PROBLEM_SOLVING',
      'INTERVIEW',
      'OTHER',
    ],
    default: 'OTHER',
    index: true,
  })
  category?: string;

  @Prop({
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
    index: true,
  })
  visibility?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Chapter' }], default: [] })
  chapters?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  /** App-service `CommunityGroup` _id for this course (LMS ↔ community link). */
  @Prop({ type: Types.ObjectId, default: null, index: true, sparse: true })
  communityGroupId?: Types.ObjectId | null;
}

export type CourseDocument = Course & Document;

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.set('validateBeforeSave', false);
CourseSchema.index({
  title: 'text',
  smallDescription: 'text',
  description: 'text',
});
CourseSchema.index({ ownerId: 1, status: 1 });
CourseSchema.index({ category: 1, level: 1, visibility: 1 });
