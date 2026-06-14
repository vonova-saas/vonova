import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProblemDto, ListProblemsDto } from './dto/problem.dto';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { EnrollService } from '../../course/enroll/enroll.service';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from './schemas/problem-sheet.schema';

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(ProblemSheet.name, 'lms-ai')
    private readonly sheetModel: Model<ProblemSheetDocument>,
    private readonly enrollService: EnrollService,
  ) { }

  async createProblem(dto: CreateProblemDto, createdBy: string) {
    const created = await this.problemModel.create({
      ...dto,
      timeLimit: dto.timeLimit ?? 2000,
      memoryLimit: dto.memoryLimit ?? 128,
      createdBy,
    });
    this.logger.log(
      `Problem created: ${created._id.toString()} by ${createdBy}`,
    );
    return created;
  }

  async deleteProblem(problemId: string, requesterId: string) {
    const problem = await this.problemModel.findById(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    if (problem.createdBy !== requesterId) {
      throw new ForbiddenException('Only creator can delete the problem');
    }
    await this.problemModel.deleteOne({ _id: problemId });
    return { success: true, message: 'Problem deleted successfully' };
  }

  async listProblems(filters?: ListProblemsDto, userId?: string) {
    const query: Record<string, unknown> = {};

    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters?.category) {
      query.categories = filters.category;
    }

    // Exclude sheet-scoped problems from global listings
    query.isSheetScoped = { $ne: true };

    const rows = await this.problemModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allowed: typeof rows = [];
    for (const p of rows) {
      const visibility = (p as { visibility?: string }).visibility ?? 'PUBLIC';
      const isOwner = !!userId && String(p.createdBy) === userId;

      if (visibility === 'PRIVATE') {
        // PRIVATE problems are course-only and must never appear in the global
        // Problem Solving listing — even for enrolled students. They reach a
        // PRIVATE problem only by clicking it from the lesson page, where
        // `getProblem` / `assertProblemAccess` enforce enrollment.
        // The creator (instructor) still sees their own private problems in
        // listings so they can manage them.
        if (isOwner) {
          allowed.push(p);
        }
        continue;
      }

      // PUBLIC (or legacy) problems are listed for everyone. Course-scoped
      // PUBLIC items are not gated here on purpose — visibility is the
      // authoritative listing signal so creators don't accidentally hide
      // their public problems behind an enrollment wall.
      allowed.push(p);
    }
    return allowed;
  }

  async getProblem(problemId: string, userId?: string) {
    const problem = await this.problemModel.findById(problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    if (userId && problem.sheetId) {
      const sheet = await this.sheetModel.findById(problem.sheetId).lean();
      if (!sheet) {
        throw new NotFoundException('Problem sheet not found');
      }
      if (
        sheet.status !== 'published' &&
        String(sheet.instructorId) !== userId
      ) {
        throw new ForbiddenException('Draft sheet is private to the instructor');
      }
      return problem;
    }

    if (userId) {
      await this.enrollService.assertProblemAccess(userId, problemId);
    }
    return problem;
  }

  /**
   * Create a problem inside a sheet (sheet-first workflow).
   * Automatically sets sheetId, isSheetScoped=true, visibilityScope="SHEET_ONLY".
   */
  async createProblemInSheet(
    dto: CreateProblemDto,
    createdBy: string,
    sheetId: string,
  ) {
    await this.assertSheetOwner(sheetId, createdBy);
    const created = await this.problemModel.create({
      ...dto,
      timeLimit: dto.timeLimit ?? 2000,
      memoryLimit: dto.memoryLimit ?? 128,
      createdBy,
      sheetId,
      isSheetScoped: true,
      visibilityScope: 'SHEET_ONLY',
    });
    this.logger.log(
      `Sheet-scoped problem created: ${created._id.toString()} in sheet ${sheetId} by ${createdBy}`,
    );
    return created;
  }

  async updateSheetProblem(
    sheetId: string,
    problemId: string,
    dto: Partial<CreateProblemDto>,
    requesterId: string,
  ) {
    await this.assertSheetOwner(sheetId, requesterId);
    const problem = await this.problemModel.findOne({
      _id: problemId,
      sheetId,
      isSheetScoped: true,
      visibilityScope: 'SHEET_ONLY',
    });
    if (!problem) {
      throw new NotFoundException('Sheet problem not found');
    }

    const allowedKeys: Array<keyof CreateProblemDto> = [
      'title',
      'description',
      'constraints',
      'testCases',
      'functionName',
      'parameterNames',
      'allowUnorderedArrayOutput',
      'timeLimit',
      'memoryLimit',
      'difficulty',
      'categories',
    ];
    for (const key of allowedKeys) {
      if (dto[key] !== undefined) {
        (problem as unknown as Record<string, unknown>)[key] = dto[key];
      }
    }
    problem.sheetId = new Types.ObjectId(sheetId) as never;
    problem.isSheetScoped = true;
    problem.visibilityScope = 'SHEET_ONLY';
    await problem.save();
    return problem.toObject();
  }

  async deleteSheetProblem(
    sheetId: string,
    problemId: string,
    requesterId: string,
  ) {
    await this.assertSheetOwner(sheetId, requesterId);
    const deleted = await this.problemModel.findOneAndDelete({
      _id: problemId,
      sheetId,
      isSheetScoped: true,
      visibilityScope: 'SHEET_ONLY',
    });
    if (!deleted) {
      throw new NotFoundException('Sheet problem not found');
    }
    return { success: true, message: 'Sheet problem deleted successfully' };
  }

  private async assertSheetOwner(sheetId: string, instructorId: string) {
    const sheet = await this.sheetModel.findById(sheetId).lean();
    if (!sheet) {
      throw new NotFoundException('Problem sheet not found');
    }
    if (String(sheet.instructorId) !== instructorId) {
      throw new ForbiddenException('Not your sheet');
    }
    return sheet;
  }
}
