import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

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
  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  input: unknown;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  expected: unknown;

  @Prop({ default: false })
  ignoreArrayOrder?: boolean;

  @Prop({ default: false })
  isHidden?: boolean;
}

export const ProblemTestCaseSchema =
  SchemaFactory.createForClass(ProblemTestCase);

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

  @Prop({ required: true, trim: true })
  functionName: string;

  /**
   * Ordered formal parameters for test `input` → positional args (language-agnostic).
   * Required for judging; e.g. Two Sum: `['nums', 'target']`.
   */
  @Prop({ type: [String] })
  parameterNames?: string[];

  @Prop({ default: false })
  allowUnorderedArrayOutput: boolean;

  @Prop({ required: true, default: 2000, min: 100, max: 20000 })
  timeLimit: number;

  @Prop({ required: true, default: 128, min: 16, max: 1024 })
  memoryLimit: number;

  @Prop({
    type: String,
    required: true,
    enum: PROBLEM_DIFFICULTIES,
    lowercase: true,
    index: true,
  })
  difficulty: string;

  @Prop({
    type: [String],
    default: [],
    enum: PROBLEM_CATEGORIES,
    lowercase: true,
    index: true,
  })
  categories: string[];

  @Prop({ required: true, trim: true, index: true })
  createdBy: string;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ createdBy: 1, createdAt: -1 });
ProblemSchema.index({ difficulty: 1, categories: 1, createdAt: -1 });
