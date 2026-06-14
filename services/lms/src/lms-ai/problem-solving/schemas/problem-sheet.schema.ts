import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProblemSheetDocument = ProblemSheet & Document;

@Schema({ _id: false })
export class EmbeddedSheetQuestion {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '', maxlength: 8000 })
  description: string;

  @Prop({ default: 'medium', enum: ['easy', 'medium', 'hard'] })
  difficulty: string;
}

const EmbeddedSheetQuestionSchema = SchemaFactory.createForClass(
  EmbeddedSheetQuestion,
);

@Schema({ timestamps: true })
export class ProblemSheet {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ default: '', maxlength: 4000 })
  description: string;

  @Prop({ default: '', trim: true, maxlength: 220 })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', default: null, index: true })
  courseId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null, index: true })
  chapterId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Lesson', default: null, index: true })
  lessonId: Types.ObjectId | null;

  @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: 'easy' | 'medium' | 'hard';

  @Prop({
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published';

  @Prop({
    type: String,
    enum: ['private', 'public'],
    default: 'private',
  })
  visibility: 'private' | 'public';

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [EmbeddedSheetQuestionSchema], default: [] })
  embeddedQuestions: EmbeddedSheetQuestion[];

  @Prop({ type: Number, default: 0, min: 0 })
  totalQuestions: number;

  @Prop({ type: Number, default: null, min: 1 })
  timerMinutes: number | null;

  @Prop({ type: Number, default: null, min: 1 })
  estimatedDuration: number | null;

  @Prop({ type: Date, default: null })
  dueDate: Date | null;

  @Prop({ type: String, default: '' })
  coverImage: string;

  @Prop({ type: Number, default: 0, min: 0 })
  completionCount: number;
}

export const ProblemSheetSchema = SchemaFactory.createForClass(ProblemSheet);
ProblemSheetSchema.index({ instructorId: 1, updatedAt: -1 });
ProblemSheetSchema.index({ courseId: 1, chapterId: 1, lessonId: 1 });
