import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SheetProgressSnapshotDocument = SheetProgressSnapshot & Document;

/**
 * Lightweight snapshot for incremental sheet progress tracking.
 * This model stores pre-computed progress data to avoid full recalculation
 * on every submission, preventing server crashes from excessive computation.
 */
@Schema({
  collection: 'sheet_progress_snapshots',
  timestamps: true,
})
export class SheetProgressSnapshot {
  @Prop({ required: true, trim: true, index: true })
  studentId: string;

  @Prop({ required: true, trim: true, index: true })
  sheetId: string;

  /**
   * Number of problems solved by the student in this sheet.
   * Updated incrementally when a problem is solved for the first time.
   */
  @Prop({ default: 0, min: 0 })
  solvedProblemsCount: number;

  /**
   * Total number of problems in the sheet.
   * Updated when problems are added/removed from the sheet.
   */
  @Prop({ default: 0, min: 0 })
  totalProblems: number;

  /**
   * Completion percentage (0-100).
   * Computed incrementally: (solvedProblemsCount / totalProblems) * 100
   */
  @Prop({ default: 0, min: 0, max: 100 })
  completionPercentage: number;

  /**
   * Whether the sheet is fully completed.
   * Updated incrementally when completionPercentage reaches 100.
   */
  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  /**
   * Array of problem IDs that have been solved by the student.
   * Updated incrementally when a problem is solved.
   */
  @Prop({ type: [String], default: [] })
  completedProblemIds: string[];

  /**
   * Timestamp when this snapshot was last updated.
   * Used for cache invalidation and freshness checks.
   */
  @Prop({ type: Date, default: () => new Date() })
  lastUpdatedAt: Date;
}

export const SheetProgressSnapshotSchema = SchemaFactory.createForClass(
  SheetProgressSnapshot,
);
SheetProgressSnapshotSchema.index({ studentId: 1, sheetId: 1 }, { unique: true });
SheetProgressSnapshotSchema.index({ studentId: 1, completed: 1 });
SheetProgressSnapshotSchema.index({ sheetId: 1, completed: 1 });
