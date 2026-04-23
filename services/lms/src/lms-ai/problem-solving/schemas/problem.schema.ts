import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const PROBLEM_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const PROBLEM_CATEGORIES = [
  'arrays',
  'strings',
  'hashmap',
  'math',
  'dp',
  'recursion',
  'sorting',
] as const;

@Schema({ _id: false })
export class ProblemTestCase {
  @Prop({ required: true, trim: true })
  input: string;

  @Prop({ required: true, trim: true })
  output: string;
}

export const ProblemTestCaseSchema = SchemaFactory.createForClass(ProblemTestCase);

export type ProblemDocument = Problem & Document;

@Schema({
  collection: 'problems',
  timestamps: true,
})
export class Problem {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  constraints: string;

  @Prop({ type: [ProblemTestCaseSchema], default: [] })
  testCases: ProblemTestCase[];

  @Prop({
    required: true,
    enum: PROBLEM_DIFFICULTIES,
    lowercase: true,
    index: true,
  })
  difficulty: (typeof PROBLEM_DIFFICULTIES)[number];

  @Prop({
    type: [String],
    default: [],
    enum: PROBLEM_CATEGORIES,
    lowercase: true,
    index: true,
  })
  categories: (typeof PROBLEM_CATEGORIES)[number][];

  @Prop({ required: true, trim: true, index: true })
  createdBy: string;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ createdBy: 1, createdAt: -1 });
ProblemSchema.index({ difficulty: 1, categories: 1, createdAt: -1 });

