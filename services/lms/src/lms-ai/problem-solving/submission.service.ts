import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubmissionDto } from './dto/submission.dto';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(Submission.name, 'lms-ai')
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  async createSubmission(dto: CreateSubmissionDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const evaluation = this.evaluateSubmission(problem.testCases, dto.code);
    const submission = await this.submissionModel.create({
      userId,
      problemId: dto.problemId,
      code: dto.code,
      language: dto.language,
      status: evaluation.status,
      failedTestCase: evaluation.failedTestCase,
    });

    this.logger.log(
      `Submission stored: ${submission._id.toString()} status=${submission.status}`,
    );
    return submission;
  }

  async hasFailedSubmission(userId: string, problemId: string): Promise<boolean> {
    const failed = await this.submissionModel.exists({
      userId,
      problemId,
      status: 'wrong_answer',
    });
    return Boolean(failed);
  }

  async getLatestSubmission(userId: string, problemId: string) {
    return this.submissionModel
      .findOne({ userId, problemId })
      .sort({ createdAt: -1 })
      .lean();
  }

  private evaluateSubmission(
    testCases: Array<{ input: string; output: string }>,
    code: string,
  ): {
    status: 'accepted' | 'wrong_answer';
    failedTestCase: { input: string; output: string } | null;
  } {
    const normalizedCode = code.toLowerCase();
    for (const testCase of testCases) {
      const expected = testCase.output.trim().toLowerCase();
      if (!normalizedCode.includes(expected)) {
        return {
          status: 'wrong_answer',
          failedTestCase: testCase,
        };
      }
    }
    return {
      status: 'accepted',
      failedTestCase: null,
    };
  }
}

