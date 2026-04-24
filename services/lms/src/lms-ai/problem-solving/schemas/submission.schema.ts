import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubmissionDocument = Submission & Document;

@Schema({
  collection: 'submissions',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class Submission {
  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, index: true })
  problemId: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, trim: true })
  language: string;

  @Prop({
    required: true,
    enum: [
      'pending',
      'accepted',
      'wrong_answer',
      'runtime_error',
      'time_limit_exceeded',
      'memory_limit_exceeded',
    ],
    default: 'pending',
  })
  status:
    | 'pending'
    | 'accepted'
    | 'wrong_answer'
    | 'runtime_error'
    | 'time_limit_exceeded'
    | 'memory_limit_exceeded';

  @Prop({ required: true, default: false })
  success: boolean;

  @Prop({ required: true, default: 0 })
  passed: number;

  @Prop({ required: true, default: 0 })
  total: number;

  @Prop({ type: [Object], default: [] })
  failedCases: Array<{
    input: unknown;
    expected: unknown;
    output?: unknown;
    error?: string;
  }>;

  /** Per-test-case verdict (same order as `problem.testCases` in DB). */
  @Prop({ type: [Object], default: [] })
  caseResults?: Array<{
    passed: boolean;
    output: unknown;
    expected: unknown;
    error: string | null;
    input?: unknown;
  }>;

  @Prop({ default: 0 })
  executionTime: number;

  @Prop({ default: 0 })
  memoryUsed: number;

  @Prop({ type: [String], default: [] })
  judgeLogs: string[];

  @Prop()
  createdAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
