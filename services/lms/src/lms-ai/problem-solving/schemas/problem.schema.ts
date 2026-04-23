import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ required: true, trim: true, index: true })
  createdBy: string;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ createdBy: 1, createdAt: -1 });

