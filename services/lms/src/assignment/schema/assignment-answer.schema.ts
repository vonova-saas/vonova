/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface AssignmentAnswerItem {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface AssignmentAnswerDocument extends Document {
  assignment: Types.ObjectId;
  userId: Types.ObjectId;
  answers: AssignmentAnswerItem[];
  score: number;
  total: number;
  percentage: number;
  submittedAt: Date;
  gradedAt: Date;
}

@Schema({ _id: false })
class AssignmentAnswerItemClass {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  selectedOptionId: string;

  @Prop({ required: true })
  correct: boolean;
}
export const AssignmentAnswerItemSchema = SchemaFactory.createForClass(
  AssignmentAnswerItemClass,
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
export class AssignmentAnswer
  extends Document
  implements AssignmentAnswerDocument
{
  @Prop({
    type: Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true,
  })
  assignment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [AssignmentAnswerItemSchema], default: [] })
  answers: AssignmentAnswerItem[];

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

export const AssignmentAnswerSchema =
  SchemaFactory.createForClass(AssignmentAnswer);
