import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubmissionJobDocument = SubmissionJob & Document;

type JudgeResult = {
  passed: number;
  total: number;
  status:
    | 'accepted'
    | 'wrong_answer'
    | 'runtime_error'
    | 'time_limit_exceeded'
    | 'memory_limit_exceeded';
  failedCases: Array<{
    input: unknown;
    expected: unknown;
    output?: unknown;
    error?: string;
  }>;
  executionTime: number;
  memoryUsed: number;
};

@Schema({
  collection: 'submission_jobs',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class SubmissionJob {
  @Prop({ required: true, trim: true, index: true })
  submissionId: string;

  @Prop({ required: true, trim: true, index: true })
  problemId: string;

  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, trim: true })
  language: string;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'done', 'failed'],
    default: 'pending',
    index: true,
  })
  status: 'pending' | 'processing' | 'done' | 'failed';

  @Prop({ default: 0, index: true })
  retryCount: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop({ type: Object, default: null })
  result?: JudgeResult | null;

  @Prop()
  createdAt: Date;
}

export const SubmissionJobSchema = SchemaFactory.createForClass(SubmissionJob);
SubmissionJobSchema.index({ status: 1, createdAt: 1 });
