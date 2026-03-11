import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewCourseDocument = ReviewCourse & Document;

@Schema({ timestamps: true })
export class ReviewCourse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  body?: string;
}

export const ReviewCourseSchema = SchemaFactory.createForClass(ReviewCourse);
ReviewCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
