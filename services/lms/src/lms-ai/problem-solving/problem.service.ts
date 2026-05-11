import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProblemDto, ListProblemsDto } from './dto/problem.dto';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { EnrollService } from '../../course/enroll/enroll.service';

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    private readonly enrollService: EnrollService,
  ) {}

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

    const rows = await this.problemModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allowed: typeof rows = [];
    for (const p of rows) {
      const id = String(p._id);
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
    if (userId) {
      await this.enrollService.assertProblemAccess(userId, problemId);
    }
    return problem;
  }
}
