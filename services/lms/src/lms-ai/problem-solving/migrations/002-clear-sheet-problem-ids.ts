import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from '../schemas/problem-sheet.schema';
import { Problem, ProblemDocument } from '../schemas/problem.schema';

/**
 * Migration 002: Remove legacy ProblemSheet.problemIds
 *
 * Sheet membership is defined only by Problem.sheetId.
 * This migration clears any remaining problemIds arrays on sheet documents.
 */
@Injectable()
export class Migration002ClearSheetProblemIds {
  private readonly logger = new Logger(Migration002ClearSheetProblemIds.name);

  constructor(
    @InjectModel(ProblemSheet.name, 'lms-ai')
    private readonly sheetModel: Model<ProblemSheetDocument>,
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
  ) {}

  async up(): Promise<void> {
    this.logger.log('Starting migration 002: Clear legacy problemIds on sheets');

    const result = await this.sheetModel.updateMany(
      { problemIds: { $exists: true } },
      { $unset: { problemIds: '' } },
    );
    this.logger.log(
      `Unset problemIds on ${result.modifiedCount} ProblemSheet documents`,
    );

    await this.problemModel.createIndexes();
    await this.sheetModel.createIndexes();
    this.logger.log('Migration 002 completed');
  }

  async down(): Promise<void> {
    this.logger.log('Rolling back migration 002: Restore empty problemIds arrays');
    await this.sheetModel.updateMany(
      { problemIds: { $exists: false } },
      { $set: { problemIds: [] } },
    );
  }
}
