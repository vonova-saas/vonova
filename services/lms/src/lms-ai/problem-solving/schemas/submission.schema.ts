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

  @Prop({ required: true, enum: ['accepted', 'wrong_answer'] })
  status: 'accepted' | 'wrong_answer';

  @Prop({ type: Object, default: null })
  failedTestCase: { input: string; output: string } | null;

  @Prop()
  createdAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

