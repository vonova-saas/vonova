import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressDocument,
} from './schemas/problem-solving-progress.schema';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectModel(ProblemSolvingProgress.name)
    private readonly progressModel: Model<ProblemSolvingProgressDocument>,
  ) {}

  async markAsSolved(userId: string, problemId: string): Promise<boolean> {
    this.logger.log(
      `Marking problem ${problemId} as solved for user ${userId}`,
    );

    const progress = await this.progressModel.findOneAndUpdate(
      { userId, problemId },
      { solved: true },
      { upsert: true, new: true },
    );

    return progress?.solved ?? false;
  }

  async getSolvedProblems(userId: string): Promise<string[]> {
    this.logger.log(`Getting solved problems for user ${userId}`);

    const solvedRecords = await this.progressModel
      .find({ userId, solved: true })
      .select('problemId')
      .exec();

    return solvedRecords.map((record) => record.problemId);
  }

  async isProblemSolved(userId: string, problemId: string): Promise<boolean> {
    const progress = await this.progressModel.findOne({ userId, problemId });
    return progress?.solved ?? false;
  }
}
