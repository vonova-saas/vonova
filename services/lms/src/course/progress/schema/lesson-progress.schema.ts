import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonProgressDocument = LessonProgress & Document;

@Schema({ timestamps: true })
export class LessonProgress {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Course', index: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Lesson', index: true })
  lessonId: Types.ObjectId;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0 })
  timeSpentSec?: number;
}

export const LessonProgressSchema =
  SchemaFactory.createForClass(LessonProgress);
LessonProgressSchema.index(
  { userId: 1, courseId: 1, lessonId: 1 },
  { unique: true },
);
