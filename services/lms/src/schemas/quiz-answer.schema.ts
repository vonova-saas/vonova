import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface QuizAnswerItem {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface QuizAnswerDocument extends Document {
  quiz: Types.ObjectId;
  userId: Types.ObjectId;
  answers: QuizAnswerItem[];
  score: number;
  total: number;
  percentage: number;
  submittedAt: Date;
  gradedAt: Date;
}

@Schema({ _id: false })
class QuizAnswerItemClass {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  selectedOptionId: string;

  @Prop({ required: true })
  correct: boolean;
}

export const QuizAnswerItemSchema = SchemaFactory.createForClass(
  QuizAnswerItemClass,
);

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc: unknown, ret: any) {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  },
})
export class QuizAnswer
  extends Document
  implements QuizAnswerDocument
{
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quiz: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [QuizAnswerItemSchema], default: [] })
  answers: QuizAnswerItem[];

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ default: Date.now })
  submittedAt: Date;

  @Prop({ default: Date.now })
  gradedAt: Date;
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);
