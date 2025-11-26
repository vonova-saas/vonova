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

export interface AssignmentDocument extends Document {
  title: string;
  description?: string;
  topic: string;
  noOfQuestions: number;
  questions: Question[];
  // createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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

@Schema({
  timestamps: true,
  toJSON: {
    transform(doc: unknown, ret: any) {
      ret.id = `assignment-${ret._id?.toString().slice(0, 6)}`;
      delete ret._id;
      return ret;
    },
  },
})
export class Assignment extends Document implements AssignmentDocument {
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

  // @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  // createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
