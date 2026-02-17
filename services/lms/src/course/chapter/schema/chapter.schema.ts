import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  index: number;
}

export type ChapterDocument = Chapter & Document;

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ courseId: 1, index: 1 });
