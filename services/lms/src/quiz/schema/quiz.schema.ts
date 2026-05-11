import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
}

export type QuizVisibility = 'PUBLIC' | 'PRIVATE';

export interface QuizDocument extends Document {
  title: string;
  description?: string;
  topic: string;
  noOfQuestions: number;
  questions: Question[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  visibility: QuizVisibility;
  courseId?: Types.ObjectId | null;
  lessonId?: Types.ObjectId | null;
}

@Schema({ _id: false })
class OptionClass {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;
}

export const OptionSchema = SchemaFactory.createForClass(OptionClass);

@Schema({ _id: false })
class QuestionClass {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [OptionSchema], default: [] })
  options: Option[];

  @Prop({ required: true })
  correctOptionId: string;
}

export const QuestionSchema = SchemaFactory.createForClass(QuestionClass);

@Schema({ timestamps: true })
export class Quiz extends Document implements QuizDocument {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, index: true })
  topic: string;

  @Prop({ required: true, min: 1 })
  noOfQuestions: number;

  @Prop({ type: [QuestionSchema], default: [] })
  questions: Question[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
    index: true,
  })
  visibility: QuizVisibility;

  @Prop({ type: Types.ObjectId, ref: 'Course', default: null, index: true })
  courseId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Lesson', default: null, index: true })
  lessonId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
