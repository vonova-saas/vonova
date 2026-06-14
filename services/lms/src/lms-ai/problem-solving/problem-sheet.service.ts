import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateProblemSheetDto,
  UpdateProblemSheetDto,
} from './dto/problem-sheet.dto';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from './schemas/problem-sheet.schema';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import {
  SHEET_PROBLEM_METADATA_PROJECTION,
  toSheetProblemSummary,
} from './utils/sheet-problem-summary.util';

@Injectable()
export class ProblemSheetService {
  constructor(
    @InjectModel(ProblemSheet.name, 'lms-ai')
    private readonly sheetModel: Model<ProblemSheetDocument>,
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
  ) {}

  private embeddedQuestionCount(doc: { embeddedQuestions?: unknown[] }) {
    return doc.embeddedQuestions?.length ?? 0;
  }

  private async sheetProblemCount(sheetId: string | Types.ObjectId) {
    return this.problemModel.countDocuments({
      sheetId: new Types.ObjectId(String(sheetId)),
      isSheetScoped: true,
      visibilityScope: 'SHEET_ONLY',
    });
  }

  private async sheetProblemCounts(sheetIds: Array<string | Types.ObjectId>) {
    if (sheetIds.length === 0) return new Map<string, number>();
    const rows = await this.problemModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          sheetId: {
            $in: sheetIds.map((id) => new Types.ObjectId(String(id))),
          },
          isSheetScoped: true,
          visibilityScope: 'SHEET_ONLY',
        },
      },
      { $group: { _id: '$sheetId', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [String(row._id), row.count]));
  }

  private async loadSheetProblemSummaries(
    sheetId: string | Types.ObjectId,
    sheetStatus: string,
  ) {
    const rows = await this.problemModel
      .find({
        sheetId: new Types.ObjectId(String(sheetId)),
        isSheetScoped: true,
        visibilityScope: 'SHEET_ONLY',
      })
      .select(SHEET_PROBLEM_METADATA_PROJECTION)
      .sort({ createdAt: 1 })
      .lean();

    return rows.map((problem, index) =>
      toSheetProblemSummary(problem, index + 1, sheetStatus),
    );
  }

  private async toSheetPayload<
    T extends { _id?: unknown; embeddedQuestions?: unknown[]; status?: string },
  >(sheet: T) {
    const sheetStatus = sheet.status ?? 'draft';
    const problems = sheet._id
      ? await this.loadSheetProblemSummaries(String(sheet._id), sheetStatus)
      : [];
    const totalQuestions =
      problems.length + this.embeddedQuestionCount(sheet);
    const { problemIds: _legacy, ...rest } = sheet as T & {
      problemIds?: unknown;
    };
    return { ...rest, problems, totalQuestions };
  }

  private toSheetListPayload<
    T extends { _id?: unknown; embeddedQuestions?: unknown[] },
  >(sheet: T, sheetScopedProblemCount: number) {
    const totalQuestions =
      sheetScopedProblemCount + this.embeddedQuestionCount(sheet);
    const { problemIds: _legacy, ...rest } = sheet as T & {
      problemIds?: unknown;
    };
    return { ...rest, totalQuestions };
  }

  private toObjectIdOrNull(id?: string | null) {
    return id ? new Types.ObjectId(id) : null;
  }

  async create(dto: CreateProblemSheetDto, instructorId: string) {
    const embeddedQuestions = dto.embeddedQuestions ?? [];
    const sheet = await this.sheetModel.create({
      title: dto.title,
      slug: dto.slug ?? '',
      description: dto.description ?? '',
      instructorId: new Types.ObjectId(instructorId),
      courseId: this.toObjectIdOrNull(dto.courseId),
      chapterId: this.toObjectIdOrNull(dto.chapterId),
      lessonId: this.toObjectIdOrNull(dto.lessonId),
      difficulty: dto.difficulty ?? 'medium',
      visibility: dto.visibility ?? 'private',
      tags: dto.tags ?? [],
      embeddedQuestions,
      totalQuestions: embeddedQuestions.length,
      timerMinutes: dto.timerMinutes ?? null,
      estimatedDuration: dto.estimatedDuration ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      coverImage: dto.coverImage ?? '',
      completionCount: 0,
      status: 'draft',
    });
    return this.toSheetPayload(sheet.toObject());
  }

  async list(instructorId?: string, status?: 'draft' | 'published') {
    const filter: Record<string, unknown> = {};
    if (instructorId) filter.instructorId = new Types.ObjectId(instructorId);
    if (status) filter.status = status;
    const sheets = await this.sheetModel.find(filter).sort({ updatedAt: -1 }).lean();
    const counts = await this.sheetProblemCounts(sheets.map((sheet) => sheet._id));
    return sheets.map((sheet) =>
      this.toSheetListPayload(sheet, counts.get(String(sheet._id)) ?? 0),
    );
  }

  async getById(id: string, userId?: string) {
    const sheet = await this.sheetModel.findById(id).lean();
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (
      sheet.status === 'draft' &&
      userId &&
      String(sheet.instructorId) !== userId
    ) {
      throw new ForbiddenException('Draft sheet is private to the instructor');
    }
    return this.toSheetPayload(sheet);
  }

  async update(id: string, dto: UpdateProblemSheetDto, instructorId: string) {
    const sheet = await this.sheetModel.findById(id);
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (String(sheet.instructorId) !== instructorId) {
      throw new ForbiddenException('Not your sheet');
    }
    if (dto.title !== undefined) sheet.title = dto.title;
    if (dto.slug !== undefined) sheet.slug = dto.slug;
    if (dto.description !== undefined) sheet.description = dto.description;
    if (dto.status !== undefined) sheet.status = dto.status;
    if (dto.visibility !== undefined) sheet.visibility = dto.visibility;
    if (dto.courseId !== undefined) {
      sheet.courseId = this.toObjectIdOrNull(dto.courseId);
    }
    if (dto.chapterId !== undefined) {
      sheet.chapterId = this.toObjectIdOrNull(dto.chapterId);
    }
    if (dto.lessonId !== undefined) {
      sheet.lessonId = this.toObjectIdOrNull(dto.lessonId);
    }
    if (dto.difficulty !== undefined) sheet.difficulty = dto.difficulty;
    if (dto.tags !== undefined) sheet.tags = dto.tags;
    if (dto.embeddedQuestions !== undefined) {
      sheet.embeddedQuestions = dto.embeddedQuestions as never;
    }
    if (dto.timerMinutes !== undefined) sheet.timerMinutes = dto.timerMinutes;
    if (dto.estimatedDuration !== undefined) {
      sheet.estimatedDuration = dto.estimatedDuration;
    }
    if (dto.dueDate !== undefined) {
      sheet.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.coverImage !== undefined) sheet.coverImage = dto.coverImage;
    sheet.totalQuestions =
      this.embeddedQuestionCount(sheet) + (await this.sheetProblemCount(id));
    await sheet.save();
    return this.toSheetPayload(sheet.toObject());
  }

  async publish(id: string, instructorId: string) {
    const sheet = await this.sheetModel.findById(id);
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (String(sheet.instructorId) !== instructorId) {
      throw new ForbiddenException('Not your sheet');
    }
    const total =
      this.embeddedQuestionCount(sheet) + (await this.sheetProblemCount(sheet._id));
    if (total === 0) {
      throw new ForbiddenException(
        'Cannot publish an empty sheet. Add at least one problem first.',
      );
    }
    sheet.totalQuestions = total;
    sheet.status = 'published';
    await sheet.save();
    return this.toSheetPayload(sheet.toObject());
  }

  async unpublish(id: string, instructorId: string) {
    return this.update(id, { status: 'draft' }, instructorId);
  }

  async duplicate(id: string, instructorId: string) {
    const sheet = await this.sheetModel.findById(id).lean();
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (String(sheet.instructorId) !== instructorId) {
      throw new ForbiddenException('Not your sheet');
    }

    const duplicated = await this.sheetModel.create({
      title: `${sheet.title} Copy`,
      slug: sheet.slug ? `${sheet.slug}-copy-${Date.now()}` : '',
      description: sheet.description,
      instructorId: sheet.instructorId,
      courseId: sheet.courseId ?? null,
      chapterId: sheet.chapterId ?? null,
      lessonId: sheet.lessonId ?? null,
      difficulty: sheet.difficulty ?? 'medium',
      visibility: sheet.visibility ?? 'private',
      tags: sheet.tags ?? [],
      embeddedQuestions: sheet.embeddedQuestions ?? [],
      totalQuestions: this.embeddedQuestionCount(sheet),
      timerMinutes: sheet.timerMinutes ?? null,
      estimatedDuration: sheet.estimatedDuration ?? null,
      dueDate: sheet.dueDate ?? null,
      coverImage: sheet.coverImage ?? '',
      completionCount: 0,
      status: 'draft',
    });

    const sourceProblems = await this.problemModel
      .find({
        sheetId: new Types.ObjectId(id),
        isSheetScoped: true,
        visibilityScope: 'SHEET_ONLY',
      })
      .sort({ createdAt: 1 })
      .lean();

    for (const problem of sourceProblems) {
      await this.problemModel.create({
        title: problem.title,
        description: problem.description,
        constraints: problem.constraints,
        functionName: problem.functionName,
        parameterNames: problem.parameterNames,
        allowUnorderedArrayOutput: problem.allowUnorderedArrayOutput,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        testCases: problem.testCases,
        difficulty: problem.difficulty,
        categories: problem.categories,
        createdBy: instructorId,
        sheetId: duplicated._id,
        isSheetScoped: true,
        visibilityScope: 'SHEET_ONLY',
      });
    }

    duplicated.totalQuestions =
      this.embeddedQuestionCount(sheet) + sourceProblems.length;
    await duplicated.save();

    return this.toSheetPayload(duplicated.toObject());
  }

  async remove(id: string, instructorId: string) {
    const sheet = await this.sheetModel.findById(id);
    if (!sheet) throw new NotFoundException('Problem sheet not found');
    if (String(sheet.instructorId) !== instructorId) {
      throw new ForbiddenException('Not your sheet');
    }
    await sheet.deleteOne();
    return { ok: true };
  }
}
