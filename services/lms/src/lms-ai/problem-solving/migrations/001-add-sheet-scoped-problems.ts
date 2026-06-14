import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument } from '../schemas/problem.schema';
import {
  SheetProgressSnapshot,
  SheetProgressSnapshotDocument,
} from '../schemas/sheet-progress-snapshot.schema';
import {
  SheetProgress,
  SheetProgressDocument,
} from '../schemas/sheet-progress.schema';

/**
 * Migration 001: Add sheet-scoped problem support
 *
 * This migration adds the following fields to the Problem schema:
 * - sheetId: ObjectId (nullable)
 * - isSheetScoped: boolean (default: false)
 * - visibilityScope: string enum ['SHEET_ONLY', 'PUBLIC', 'PRIVATE'] (default: 'PUBLIC')
 *
 * It also creates the SheetProgressSnapshot collection for incremental progress tracking.
 *
 * Backward compatibility:
 * - Existing problems will have sheetId=null, isSheetScoped=false, visibilityScope='PUBLIC'
 * - This ensures they continue to appear in global problem lists
 * - The migration is non-destructive and can be rolled back
 */
@Injectable()
export class Migration001AddSheetScopedProblems {
  private readonly logger = new Logger(Migration001AddSheetScopedProblems.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(SheetProgressSnapshot.name, 'lms-ai')
    private readonly snapshotModel: Model<SheetProgressSnapshotDocument>,
    @InjectModel(SheetProgress.name, 'lms-ai')
    private readonly sheetProgressModel: Model<SheetProgressDocument>,
  ) {}

  async up(): Promise<void> {
    this.logger.log('Starting migration 001: Add sheet-scoped problem support');

    try {
      // Step 1: Add new fields to existing Problem documents
      this.logger.log('Step 1: Adding new fields to existing Problem documents');
      const problemUpdateResult = await this.problemModel.updateMany(
        {
          sheetId: { $exists: false },
          isSheetScoped: { $exists: false },
          visibilityScope: { $exists: false },
        },
        {
          $set: {
            sheetId: null,
            isSheetScoped: false,
            visibilityScope: 'PUBLIC',
          },
        },
      );
      this.logger.log(
        `Updated ${problemUpdateResult.modifiedCount} Problem documents`,
      );

      // Step 2: Create indexes for the new fields
      this.logger.log('Step 2: Creating indexes for new fields');
      await this.problemModel.createIndexes();
      this.logger.log('Indexes created successfully');

      // Step 3: Migrate existing SheetProgress to SheetProgressSnapshot
      this.logger.log(
        'Step 3: Migrating existing SheetProgress to SheetProgressSnapshot',
      );
      const existingProgress = await this.sheetProgressModel.find().lean();

      for (const progress of existingProgress) {
        const snapshot = await this.snapshotModel.findOneAndUpdate(
          { studentId: progress.studentId, sheetId: progress.sheetId },
          {
            $setOnInsert: {
              studentId: progress.studentId,
              sheetId: progress.sheetId,
              solvedProblemsCount: progress.solvedProblemsCount,
              totalProblems: progress.totalProblems,
              completionPercentage: progress.completionPercentage,
              completed: progress.completed,
              completedAt: progress.completedAt,
              completedProblemIds: [],
              lastUpdatedAt: new Date(),
            },
          },
          { upsert: true, new: true },
        );

        // Populate completedProblemIds by querying problem progress
        // This is a simplified approach - in production you'd want to query the actual problem progress records
        this.logger.log(
          `Created snapshot for student ${progress.studentId} in sheet ${progress.sheetId}`,
        );
      }

      this.logger.log(
        `Migrated ${existingProgress.length} SheetProgress documents to snapshots`,
      );

      this.logger.log('Migration 001 completed successfully');
    } catch (error) {
      this.logger.error('Migration 001 failed', error);
      throw error;
    }
  }

  async down(): Promise<void> {
    this.logger.log('Rolling back migration 001: Add sheet-scoped problem support');

    try {
      // Step 1: Remove new fields from Problem documents
      this.logger.log('Step 1: Removing new fields from Problem documents');
      await this.problemModel.updateMany(
        {},
        {
          $unset: {
            sheetId: 1,
            isSheetScoped: 1,
            visibilityScope: 1,
          },
        },
      );
      this.logger.log('Removed new fields from Problem documents');

      // Step 2: Drop SheetProgressSnapshot collection
      this.logger.log('Step 2: Dropping SheetProgressSnapshot collection');
      await this.snapshotModel.deleteMany({});
      this.logger.log('Dropped SheetProgressSnapshot collection');

      this.logger.log('Rollback completed successfully');
    } catch (error) {
      this.logger.error('Rollback failed', error);
      throw error;
    }
  }
}
