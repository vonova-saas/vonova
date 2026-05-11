import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonType = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT' | 'MIXED';

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  index: number;

  @Prop({ default: 0 })
  durationMinutes?: number;

  @Prop({ enum: ['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'MIXED'], default: 'VIDEO' })
  type: LessonType;

  @Prop({ default: false })
  previewable: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Quiz', default: null, index: true })
  quizId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', default: null, index: true })
  assignmentId?: Types.ObjectId | null;

  @Prop()
  content?: string;

  @Prop({ type: Types.ObjectId, ref: 'Asset', default: null })
  videoAssetId?: Types.ObjectId | null;

  /** @deprecated Removed from API; use videoObjectKey + presigned GET only */
  @Prop()
  videoUrl?: string;

  @Prop()
  videoObjectKey?: string;

  /** S3 object key for lesson thumbnail (optional). */
  @Prop()
  thumbnailKey?: string;

  @Prop({ default: false })
  hasVideo?: boolean;

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  materials?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Quiz' }], default: [] })
  quizzes?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  problems?: Types.ObjectId[];
}

export type LessonDocument = Lesson & Document;

export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ courseId: 1, chapterId: 1, index: 1 });
