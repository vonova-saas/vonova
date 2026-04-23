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

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
  ) {}

  async createProblem(dto: CreateProblemDto, createdBy: string) {
    const created = await this.problemModel.create({
      ...dto,
      createdBy,
    });
    this.logger.log(`Problem created: ${created._id.toString()} by ${createdBy}`);
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

  async listProblems(filters?: ListProblemsDto) {
    const query: Record<string, unknown> = {};

    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters?.category) {
      query.categories = filters.category;
    }

    return this.problemModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async getProblem(problemId: string) {
    const problem = await this.problemModel.findById(problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }
}

