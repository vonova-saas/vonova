import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from './schemas/problem-sheet.schema';
import {
  SheetProgress,
  SheetProgressDocument,
} from './schemas/sheet-progress.schema';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import {
  SheetProgressSnapshot,
  SheetProgressSnapshotDocument,
} from './schemas/sheet-progress-snapshot.schema';
import { ProblemSolvingProgress, ProblemSolvingProgressDocument } from './schemas/problem-solving-progress.schema';

export type SheetProgressPayload = {
  studentId: string;
  sheetId: string;
  solvedProblemsCount: number;
  totalProblems: number;
  completionPercentage: number;
  completed: boolean;
  completedAt: string | null;
  lastOpenedAt: string | null;
  currentProblemIndex: number;
  solvedProblemIds: string[];
  problemProgress: Array<{
    problemId: string;
    solved: boolean;
    solvedAt: string | null;
    attemptsCount: number;
    lastSubmissionStatus: string | null;
  }>;
};

@Injectable()
export class SheetProgressService {
  constructor(
    @InjectModel(ProblemSheet.name, 'lms-ai')
    private readonly sheetModel: Model<ProblemSheetDocument>,
    @InjectModel(SheetProgress.name, 'lms-ai')
    private readonly sheetProgressModel: Model<SheetProgressDocument>,
    @InjectModel(ProblemSolvingProgress.name, 'lms-ai')
    private readonly problemProgressModel: Model<ProblemSolvingProgressDocument>,
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(SheetProgressSnapshot.name, 'lms-ai')
    private readonly snapshotModel: Model<SheetProgressSnapshotDocument>,
  ) {}

  private async sheetScopedProblemIds(
    sheetId: string | Types.ObjectId,
  ): Promise<string[]> {
    const rows = await this.problemModel
      .find({
        sheetId: new Types.ObjectId(String(sheetId)),
        isSheetScoped: true,
        visibilityScope: 'SHEET_ONLY',
      })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean();
    return rows.map((problem) => String(problem._id));
  }

  private async assertPublishedSheet(sheetId: string) {
    const sheet = await this.sheetModel.findById(sheetId).lean();
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (sheet.status !== 'published') {
      throw new ForbiddenException('Problem sheet is not published');
    }
    return sheet;
  }

  /** Read-only: never upserts or writes. */
  async getSheetProgress(
    studentId: string,
    sheetId: string,
  ): Promise<SheetProgressPayload> {
    const sheet = await this.assertPublishedSheet(sheetId);
    const scopedProblemIds = await this.sheetScopedProblemIds(sheet._id);
    const totalProblems = scopedProblemIds.length;

    const [progressDoc, snapshot] = await Promise.all([
      this.sheetProgressModel.findOne({ studentId, sheetId }).lean(),
      this.snapshotModel.findOne({ studentId, sheetId }).lean(),
    ]);

    const completedProblemIds = (snapshot?.completedProblemIds ?? []).filter(
      (id) => scopedProblemIds.includes(id),
    );
    const solvedSet = new Set(completedProblemIds);
    const solvedProblemsCount = completedProblemIds.length;
    const completionPercentage =
      totalProblems > 0
        ? Math.round((solvedProblemsCount / totalProblems) * 100)
        : 0;
    const completed =
      totalProblems > 0 && solvedProblemsCount >= totalProblems;

    return {
      studentId,
      sheetId,
      solvedProblemsCount,
      totalProblems,
      completionPercentage,
      completed,
      completedAt: snapshot?.completedAt
        ? new Date(snapshot.completedAt).toISOString()
        : null,
      lastOpenedAt: progressDoc?.lastOpenedAt
        ? new Date(progressDoc.lastOpenedAt).toISOString()
        : null,
      currentProblemIndex: progressDoc?.currentProblemIndex ?? 0,
      solvedProblemIds: completedProblemIds,
      problemProgress: scopedProblemIds.map((problemId) => ({
        problemId,
        solved: solvedSet.has(problemId),
        solvedAt: null,
        attemptsCount: 0,
        lastSubmissionStatus: null,
      })),
    };
  }

  /** Write path: updates resume position (PATCH only). */
  async touchSheet(
    studentId: string,
    sheetId: string,
    currentProblemIndex?: number,
  ): Promise<SheetProgressPayload> {
    const sheet = await this.assertPublishedSheet(sheetId);
    const totalProblems = (await this.sheetScopedProblemIds(sheet._id)).length;
    const now = new Date();

    await this.sheetProgressModel.findOneAndUpdate(
      { studentId, sheetId },
      {
        $set: {
          ...(currentProblemIndex !== undefined
            ? { currentProblemIndex, lastOpenedAt: now }
            : { lastOpenedAt: now }),
        },
        $setOnInsert: {
          studentId,
          sheetId,
          solvedProblemsCount: 0,
          totalProblems,
          completionPercentage: 0,
          completed: false,
          completedAt: null,
        },
      },
      { upsert: true },
    );

    return this.getSheetProgress(studentId, sheetId);
  }

  async syncSheetsContainingProblem(
    studentId: string,
    problemId: string,
  ): Promise<void> {
    const sheetProblem = await this.problemModel
      .findById(problemId)
      .select('sheetId isSheetScoped')
      .lean();
    if (!sheetProblem?.sheetId || !sheetProblem.isSheetScoped) {
      return;
    }

    await this.incrementalUpdateSheetProgress(
      studentId,
      String(sheetProblem.sheetId),
      problemId,
    );
  }

  private async incrementalUpdateSheetProgress(
    studentId: string,
    sheetId: string,
    problemId: string,
  ): Promise<void> {
    const sheet = await this.sheetModel.findById(sheetId).lean();
    if (!sheet) return;

    const scopedProblemIds = await this.sheetScopedProblemIds(sheet._id);
    const totalProblems = scopedProblemIds.length;

    const problemProgress = await this.problemProgressModel.findOne({
      userId: studentId,
      problemId,
      solved: true,
    });

    if (!problemProgress) {
      return;
    }

    const snapshot = await this.snapshotModel.findOneAndUpdate(
      { studentId, sheetId },
      {
        $setOnInsert: {
          studentId,
          sheetId,
          solvedProblemsCount: 0,
          totalProblems,
          completionPercentage: 0,
          completed: false,
          completedAt: null,
          completedProblemIds: [],
          lastUpdatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    if (snapshot.completedProblemIds.includes(problemId)) {
      await this.snapshotModel.updateOne(
        { studentId, sheetId },
        { $set: { lastUpdatedAt: new Date() } },
      );
      return;
    }

    const newSolvedCount = snapshot.solvedProblemsCount + 1;
    const newCompletedIds = [...snapshot.completedProblemIds, problemId];
    const newCompletionPercentage =
      totalProblems > 0 ? Math.round((newSolvedCount / totalProblems) * 100) : 0;
    const newCompleted = totalProblems > 0 && newSolvedCount >= totalProblems;
    const now = new Date();

    await this.snapshotModel.updateOne(
      { studentId, sheetId },
      {
        $set: {
          solvedProblemsCount: newSolvedCount,
          totalProblems,
          completionPercentage: newCompletionPercentage,
          completed: newCompleted,
          completedAt: newCompleted ? (snapshot.completedAt ?? now) : null,
          completedProblemIds: newCompletedIds,
          lastUpdatedAt: now,
        },
      },
    );

    await this.sheetProgressModel.findOneAndUpdate(
      { studentId, sheetId },
      {
        $set: {
          solvedProblemsCount: newSolvedCount,
          totalProblems,
          completionPercentage: newCompletionPercentage,
          completed: newCompleted,
          completedAt: newCompleted ? (snapshot.completedAt ?? now) : null,
          lastOpenedAt: now,
        },
        $setOnInsert: { studentId, sheetId },
      },
      { upsert: true },
    );
  }
}
