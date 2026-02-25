import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProblemSolverDocument = ProblemSolver & Document;

@Schema({
  collection: 'PROBLEM_SOLVER',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class ProblemSolver {
  @Prop({ required: true, unique: true, index: true })
  problemId: string;

  @Prop({ type: String, index: true })
  userId: string;

  @Prop({ required: true })
  problem_statement: string;

  @Prop({ required: true, type: String })
  solution: string;

  @Prop({ type: [String] })
  steps: string[];

  @Prop({ type: [String] })
  concepts_used: string[];

  @Prop({
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
    index: true
  })
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';

  @Prop()
  category: string;

  @Prop({ default: 'gemini' })
  ai_model_used: string;

  @Prop({ default: 0 })
  response_time_ms: number;

  @Prop({ default: 0 })
  tokens_used: number;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  @Prop()
  ip_address: string;

  @Prop()
  user_agent: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const ProblemSolverSchema = SchemaFactory.createForClass(ProblemSolver);

// Indexes for better query performance
ProblemSolverSchema.index({ userId: 1, created_at: -1 });
ProblemSolverSchema.index({ difficulty_level: 1, created_at: -1 });
ProblemSolverSchema.index({ category: 1, created_at: -1 });
ProblemSolverSchema.index({ ai_model_used: 1, created_at: -1 });

