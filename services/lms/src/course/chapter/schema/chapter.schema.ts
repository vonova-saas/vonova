import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  index: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  lessons?: Types.ObjectId[];

  /** Future: chapter-level library attachments (same shape as lessons). */
  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  materials?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Quiz' }], default: [] })
  quizzes?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  problems?: Types.ObjectId[];
}

export type ChapterDocument = Chapter & Document;

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ courseId: 1, index: 1 });
