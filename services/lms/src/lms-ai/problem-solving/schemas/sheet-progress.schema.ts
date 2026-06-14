import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SheetProgressDocument = SheetProgress & Document;

@Schema({
  collection: 'sheet_progress',
  timestamps: true,
})
export class SheetProgress {
  @Prop({ required: true, trim: true, index: true })
  studentId: string;

  @Prop({ required: true, trim: true, index: true })
  sheetId: string;

  @Prop({ default: 0, min: 0 })
  solvedProblemsCount: number;

  @Prop({ default: 0, min: 0 })
  totalProblems: number;

  @Prop({ default: 0, min: 0, max: 100 })
  completionPercentage: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: () => new Date() })
  lastOpenedAt: Date;

  /** Resume index within sheet question list (0-based). */
  @Prop({ default: 0, min: 0 })
  currentProblemIndex: number;
}

export const SheetProgressSchema = SchemaFactory.createForClass(SheetProgress);
SheetProgressSchema.index({ studentId: 1, sheetId: 1 }, { unique: true });
