import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressDocument,
} from './schemas/problem-solving-progress.schema';
import { EnrollService } from '../../course/enroll/enroll.service';
import { SheetProgressService } from './sheet-progress.service';
import { UpdateProblemProgressDto } from './dto/progress.dto';

export type ProblemProgressPayload = {
  studentId: string;
  problemId: string;
  solved: boolean;
  solvedAt: string | null;
  attemptsCount: number;
  lastSubmissionStatus: string | null;
};

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectModel(ProblemSolvingProgress.name, 'lms-ai')
    private readonly progressModel: Model<ProblemSolvingProgressDocument>,
    private readonly enrollService: EnrollService,
    private readonly sheetProgressService: SheetProgressService,
  ) {}

  private toProblemPayload(
    userId: string,
    problemId: string,
    row: ProblemSolvingProgressDocument | null,
  ): ProblemProgressPayload {
    return {
      studentId: userId,
      problemId,
      solved: row?.solved ?? false,
      solvedAt: row?.solvedAt ? row.solvedAt.toISOString() : null,
      attemptsCount: row?.attemptsCount ?? 0,
      lastSubmissionStatus: row?.lastSubmissionStatus ?? null,
    };
  }

  async recordSubmissionResult(
    userId: string,
    problemId: string,
    status: string,
  ): Promise<ProblemProgressPayload> {
    const now = new Date();
    const accepted = status === 'accepted';

    const row = await this.progressModel.findOneAndUpdate(
      { userId, problemId },
      {
        $inc: { attemptsCount: 1 },
        $set: {
          lastSubmissionStatus: status,
          ...(accepted
            ? { solved: true, solvedAt: now }
            : {}),
        },
        $setOnInsert: { userId, problemId },
      },
      { upsert: true, new: true },
    );

    if (accepted) {
      await this.sheetProgressService.syncSheetsContainingProblem(
        userId,
        problemId,
      );
    }

    return this.toProblemPayload(userId, problemId, row);
  }

  async updateProblemProgress(
    userId: string,
    problemId: string,
    dto: UpdateProblemProgressDto,
  ): Promise<ProblemProgressPayload> {
    await this.enrollService.assertProblemAccess(userId, problemId);

    const update: Record<string, unknown> = {};
    if (dto.solved !== undefined) {
      update.solved = dto.solved;
      update.solvedAt = dto.solved ? new Date() : null;
    }
    if (dto.lastSubmissionStatus !== undefined) {
      update.lastSubmissionStatus = dto.lastSubmissionStatus;
    }
    if (dto.attemptsCount !== undefined) {
      update.attemptsCount = dto.attemptsCount;
    }

    const row = await this.progressModel.findOneAndUpdate(
      { userId, problemId },
      { $set: update, $setOnInsert: { userId, problemId } },
      { upsert: true, new: true },
    );

    if (row.solved) {
      await this.sheetProgressService.syncSheetsContainingProblem(
        userId,
        problemId,
      );
    }

    return this.toProblemPayload(userId, problemId, row);
  }

  async getProblemProgress(
    userId: string,
    problemId: string,
  ): Promise<ProblemProgressPayload> {
    await this.enrollService.assertProblemAccess(userId, problemId);
    const row = await this.progressModel.findOne({ userId, problemId });
    return this.toProblemPayload(userId, problemId, row);
  }

  async markAsSolved(userId: string, problemId: string): Promise<boolean> {
    this.logger.log(
      `Marking problem ${problemId} as solved for user ${userId}`,
    );
    await this.enrollService.assertProblemAccess(userId, problemId);

    const progress = await this.progressModel.findOneAndUpdate(
      { userId, problemId },
      {
        $set: { solved: true, solvedAt: new Date() },
        $setOnInsert: { userId, problemId },
      },
      { upsert: true, new: true },
    );

    await this.sheetProgressService.syncSheetsContainingProblem(
      userId,
      problemId,
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
