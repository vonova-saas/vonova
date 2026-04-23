import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class StoredHint {
  @Prop({ required: true, min: 1, max: 3 })
  level: 1 | 2 | 3;

  @Prop({ required: true })
  response: string;

  @Prop({ required: true, enum: ['english', 'arabic'] })
  language: 'english' | 'arabic';

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const StoredHintSchema = SchemaFactory.createForClass(StoredHint);

export type ProblemSolvingProgressDocument = ProblemSolvingProgress & Document;

@Schema({
  collection: 'problem_solving_progress',
  timestamps: true,
})
export class ProblemSolvingProgress {
  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, index: true })
  problemId: string;

  @Prop({ type: Number, default: 0, min: 0, max: 3 })
  hintsUsed: number;

  @Prop({ type: Boolean, default: false })
  solutionUsed: boolean;

  @Prop({ type: [StoredHintSchema], default: [] })
  hints: StoredHint[];
}

export const ProblemSolvingProgressSchema = SchemaFactory.createForClass(
  ProblemSolvingProgress,
);
ProblemSolvingProgressSchema.index(
  { userId: 1, problemId: 1 },
  { unique: true },
);
