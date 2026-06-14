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

  /**
   * PUBLIC = problem is listed in the global Problem Solving library for everyone.
   * PRIVATE = problem is hidden from the public list and is only accessible to
   * students enrolled in `courseId` (typically through the attached lesson).
   * Defaults to PUBLIC for backward compatibility with previously created
   * problems that don't carry a visibility field.
   */
  @Prop({
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
    index: true,
  })
  visibility: 'PUBLIC' | 'PRIVATE';

  /** Course this problem is scoped to when `visibility === 'PRIVATE'`. */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    default: null,
    index: true,
  })
  courseId?: MongooseSchema.Types.ObjectId | null;

  /** Optional lesson back-reference (set when created from the lesson editor). */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Lesson',
    default: null,
    index: true,
  })
  lessonId?: MongooseSchema.Types.ObjectId | null;

  /**
   * Sheet this problem belongs to (set when created inside a sheet).
   * If set, the problem is sheet-scoped and should not appear in global problem lists.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ProblemSheet',
    default: null,
    index: true,
  })
  sheetId?: MongooseSchema.Types.ObjectId | null;

  /**
   * Whether this problem is scoped to a specific sheet.
   * Sheet-scoped problems are only visible within their sheet context.
   */
  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isSheetScoped?: boolean;

  /**
   * Visibility scope for the problem.
   * SHEET_ONLY: Only visible within the sheet (for sheet-scoped problems)
   * PUBLIC: Visible globally (default for standalone problems)
   * PRIVATE: Visible only to enrolled students in the course
   */
  @Prop({
    type: String,
    enum: ['SHEET_ONLY', 'PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
    index: true,
  })
  visibilityScope?: 'SHEET_ONLY' | 'PUBLIC' | 'PRIVATE';
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ createdBy: 1, createdAt: -1 });
ProblemSchema.index({ difficulty: 1, categories: 1, createdAt: -1 });
ProblemSchema.index({ visibility: 1, courseId: 1, createdAt: -1 });
// Composite index for studentId + sheetId (for progress queries)
ProblemSchema.index({ studentId: 1, sheetId: 1 });
