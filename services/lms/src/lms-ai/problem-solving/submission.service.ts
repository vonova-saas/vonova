import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubmissionDto } from './dto/submission.dto';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { normalizeAIResponse } from './utils/normalize-ai-response.util';
import { compareOutputs } from './utils/output-compare.util';
import { SubmissionJudgeQueue } from './submission-judge.queue';
import { runInDocker } from './utils/docker-judge.util';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(Submission.name, 'lms-ai')
    private readonly submissionModel: Model<SubmissionDocument>,
    private readonly judgeQueue: SubmissionJudgeQueue,
  ) {}

  async createSubmission(dto: CreateSubmissionDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const normalizedCode = normalizeAIResponse(dto.code);
    this.logger.debug(
      `[submission-normalization] user=${userId} problem=${dto.problemId} raw=${JSON.stringify(
        dto.code,
      )} normalized=${JSON.stringify(normalizedCode)}`,
    );

    if (!normalizedCode || normalizedCode.trim().length === 0) {
      throw new BadRequestException(
        'Invalid code submission after normalization',
      );
    }

    const submission = await this.submissionModel.create({
      userId,
      problemId: dto.problemId,
      code: normalizedCode,
      language: dto.language,
      status: 'pending',
      success: false,
      passed: 0,
      total: (problem.testCases ?? []).length,
      failedCases: [],
      executionTime: 0,
      memoryUsed: 0,
      judgeLogs: [],
    });
    await this.judgeQueue.enqueue({ submissionId: submission._id.toString() });

    this.logger.log(
      `Submission queued: ${submission._id.toString()} status=${submission.status}`,
    );
    return {
      jobId: submission._id.toString(),
      status: submission.status,
    };
  }

  async getSubmissionStatus(submissionId: string, userId: string) {
    const submission = await this.submissionModel
      .findOne({ _id: submissionId, userId })
      .lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async processSubmissionJob(submissionId: string) {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) return;
    const problem = await this.problemModel.findById(submission.problemId).lean();
    if (!problem) {
      await this.submissionModel.updateOne(
        { _id: submissionId },
        {
          status: 'runtime_error',
          failedCases: [{ input: null, expected: null, error: 'Problem not found' }],
        },
      );
      return;
    }

    const evaluation = await this.evaluateSubmission({
      testCases: problem.testCases,
      code: submission.code,
      language: submission.language,
      functionName: String((problem as { functionName?: string }).functionName ?? ''),
      allowUnorderedArrayOutput: Boolean(
        (problem as { allowUnorderedArrayOutput?: boolean }).allowUnorderedArrayOutput,
      ),
      timeLimit: Number((problem as { timeLimit?: number }).timeLimit ?? 2000),
      memoryLimit: Number((problem as { memoryLimit?: number }).memoryLimit ?? 128),
      submissionId,
    });

    await this.submissionModel.updateOne(
      { _id: submissionId },
      {
        status: evaluation.status,
        success: evaluation.success,
        passed: evaluation.passed,
        total: evaluation.total,
        failedCases: evaluation.failedCases,
        executionTime: evaluation.executionTime,
        memoryUsed: evaluation.memoryUsed,
        judgeLogs: evaluation.judgeLogs,
      },
    );
  }

  async hasFailedSubmission(
    userId: string,
    problemId: string,
  ): Promise<boolean> {
    const failed = await this.submissionModel.exists({
      userId,
      problemId,
      status: {
        $in: [
          'wrong_answer',
          'runtime_error',
          'time_limit_exceeded',
          'memory_limit_exceeded',
        ],
      },
    });
    return Boolean(failed);
  }

  async getLatestSubmission(userId: string, problemId: string) {
    return this.submissionModel
      .findOne({ userId, problemId })
      .sort({ createdAt: -1 })
      .lean();
  }

  private async evaluateSubmission(params: {
    testCases: Array<{
      input: unknown;
      expected: unknown;
      ignoreArrayOrder?: boolean;
      isHidden?: boolean;
    }>;
    code: string;
    language: string;
    functionName: string;
    allowUnorderedArrayOutput: boolean;
    timeLimit: number;
    memoryLimit: number;
    submissionId: string;
  }): Promise<{
    status:
      | 'accepted'
      | 'wrong_answer'
      | 'runtime_error'
      | 'time_limit_exceeded'
      | 'memory_limit_exceeded';
    success: boolean;
    passed: number;
    total: number;
    executionTime: number;
    memoryUsed: number;
    judgeLogs: string[];
    failedCases: Array<{
      input: unknown;
      expected: unknown;
      output?: unknown;
      error?: string;
    }>;
  }> {
    const {
      testCases,
      code,
      language,
      functionName,
      allowUnorderedArrayOutput,
      timeLimit,
      memoryLimit,
      submissionId,
    } = params;
    if (!functionName.trim()) {
      throw new BadRequestException(
        'Problem is missing functionName for execution',
      );
    }

    let passed = 0;
    let hasRuntimeError = false;
    let hasTimeLimitError = false;
    let hasMemoryLimitError = false;
    let totalExecutionTime = 0;
    let peakMemory = 0;
    const judgeLogs: string[] = [];
    const failedCases: Array<{
      input: unknown;
      expected: unknown;
      output?: unknown;
      error?: string;
    }> = [];

    const shuffledCases = [...testCases].sort(() => Math.random() - 0.5);
    for (const testCase of shuffledCases) {
      const input = this.normalizeUnknownValue(testCase.input);
      const expected = this.normalizeUnknownValue(testCase.expected);
      const run = await runInDocker({
        code,
        functionName,
        input,
        language,
        timeLimitMs: timeLimit,
        memoryLimitMb: memoryLimit,
      });
      totalExecutionTime += run.executionTime;
      peakMemory = Math.max(peakMemory, run.memoryUsed);
      judgeLogs.push(
        `[submission=${submissionId}] case=${JSON.stringify(input)} status=${run.status} time=${run.executionTime}ms mem=${run.memoryUsed}MB`,
      );

      if (run.status === 'accepted') {
        const userOutput = this.normalizeUnknownValue(run.output);
        const isMatch = compareOutputs(expected, userOutput, {
          ignoreArrayOrder:
            Boolean(testCase.ignoreArrayOrder) || allowUnorderedArrayOutput,
        });

        if (isMatch) {
          passed += 1;
        } else {
          failedCases.push({
            input,
            expected,
            output: userOutput,
          });
        }
        continue;
      }

      hasRuntimeError = hasRuntimeError || run.status === 'runtime_error';
      hasTimeLimitError =
        hasTimeLimitError || run.status === 'time_limit_exceeded';
      hasMemoryLimitError =
        hasMemoryLimitError || run.status === 'memory_limit_exceeded';
      failedCases.push({
        input,
        expected,
        error: run.error,
      });
    }

    const total = testCases.length;
    const success = total > 0 && passed === total;
    return {
      status: success
        ? 'accepted'
        : hasMemoryLimitError
          ? 'memory_limit_exceeded'
          : hasTimeLimitError
            ? 'time_limit_exceeded'
            : hasRuntimeError
              ? 'runtime_error'
              : 'wrong_answer',
      success,
      passed,
      total,
      executionTime: totalExecutionTime,
      memoryUsed: peakMemory,
      judgeLogs,
      failedCases,
    };
  }

  private normalizeUnknownValue(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  }
}
