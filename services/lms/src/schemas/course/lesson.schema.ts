import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonType = 'VIDEO' | 'ARTICLE' | 'QUIZ';

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  index: number;

  @Prop({ default: 0 })
  durationMinutes?: number;

  @Prop({ enum: ['VIDEO', 'ARTICLE', 'QUIZ'], default: 'VIDEO' })
  type: LessonType;

  @Prop({ default: false })
  previewable: boolean;

  @Prop()
  content?: string;

  @Prop({ type: Types.ObjectId, ref: 'Asset', default: null })
  videoAssetId?: Types.ObjectId | null;
}

export type LessonDocument = Lesson & Document;

export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ courseId: 1, chapterId: 1, index: 1 });
