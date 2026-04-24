import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSubmissionDto } from './dto/submission.dto';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { SubmissionJob, SubmissionJobDocument } from './schemas/submission-job.schema';
import { normalizeAIResponse } from './utils/normalize-ai-response.util';
import { compareOutputs } from './utils/output-compare.util';
import {
  isMissingJudgeReturnValue,
  jsonCloneForJudge,
} from './utils/judge-output.util';
import { SubmissionJudgeQueue } from './submission-judge.queue';
import { runInDocker } from './utils/docker-judge.util';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  private readonly maxRetries = 2;

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(Submission.name, 'lms-ai')
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(SubmissionJob.name, 'lms-ai')
    private readonly submissionJobModel: Model<SubmissionJobDocument>,
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
    const job = await this.submissionJobModel.create({
      submissionId: submission._id.toString(),
      userId,
      problemId: dto.problemId,
      code: normalizedCode,
      language: dto.language,
      status: 'pending',
      retryCount: 0,
      result: null,
    });
    await this.judgeQueue.enqueue({ jobId: job._id.toString() });

    this.logger.log(
      `Submission queued: ${submission._id.toString()} job=${job._id.toString()} status=${submission.status}`,
    );
    return {
      jobId: job._id.toString(),
      status: 'pending',
    };
  }

  async getSubmissionStatus(submissionId: string, userId: string) {
    const job = await this.submissionJobModel
      .findOne({ _id: submissionId, userId })
      .lean();
    if (!job) {
      throw new NotFoundException('Submission not found');
    }
    if (job.status === 'pending' || job.status === 'processing') {
      return {
        _id: submissionId,
        status: 'pending',
        passed: 0,
        total: 0,
        failedCases: [],
        executionTime: 0,
        memoryUsed: 0,
      };
    }
    const result = job.result;
    if (!result) {
      return {
        _id: submissionId,
        status: 'runtime_error',
        passed: 0,
        total: 0,
        failedCases: [],
        executionTime: 0,
        memoryUsed: 0,
      };
    }
    return {
      _id: submissionId,
      status: result.status,
      passed: result.passed,
      total: result.total,
      failedCases: result.failedCases,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
    };
  }

  async recoverStuckJobs() {
    const reset = await this.submissionJobModel.updateMany(
      { status: 'processing' },
      { $set: { status: 'pending' }, $unset: { startedAt: 1 } },
    );
    if ((reset.modifiedCount ?? 0) > 0) {
      this.logger.warn(
        `Recovered ${reset.modifiedCount} stuck processing jobs back to pending`,
      );
    }
  }

  async processNextPendingJob(): Promise<boolean> {
    const now = new Date();
    const job = await this.submissionJobModel.findOneAndUpdate(
      {
        status: 'pending',
        retryCount: { $lte: this.maxRetries },
      },
      { $set: { status: 'processing', startedAt: now } },
      { sort: { createdAt: 1 }, new: true },
    );
    if (!job) return false;
    await this.processSubmissionJob(job);
    return true;
  }

  async processJobById(jobId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(jobId)) return false;
    const now = new Date();
    const job = await this.submissionJobModel.findOneAndUpdate(
      {
        _id: jobId,
        status: 'pending',
        retryCount: { $lte: this.maxRetries },
      },
      { $set: { status: 'processing', startedAt: now } },
      { new: true },
    );
    if (!job) return false;
    await this.processSubmissionJob(job);
    return true;
  }

  private async processSubmissionJob(job: SubmissionJobDocument) {
    const submissionId = job.submissionId;
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
      await this.submissionJobModel.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            result: {
              passed: 0,
              total: 0,
              status: 'runtime_error',
              failedCases: [
                { input: null, expected: null, error: 'Problem not found' },
              ],
              executionTime: 0,
              memoryUsed: 0,
            },
          },
        },
      );
      return;
    }

    try {
      const evaluation = await this.evaluateSubmission({
        testCases: problem.testCases,
        code: submission.code,
        language: submission.language,
        functionName: String((problem as { functionName?: string }).functionName ?? ''),
        allowUnorderedArrayOutput: Boolean(
          (problem as { allowUnorderedArrayOutput?: boolean })
            .allowUnorderedArrayOutput,
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
      await this.submissionJobModel.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'done',
            finishedAt: new Date(),
            result: {
              passed: evaluation.passed,
              total: evaluation.total,
              status: evaluation.status,
              failedCases: evaluation.failedCases,
              executionTime: evaluation.executionTime,
              memoryUsed: evaluation.memoryUsed,
            },
          },
        },
      );
    } catch (error) {
      const nextRetry = (job.retryCount ?? 0) + 1;
      const shouldRetry = nextRetry <= this.maxRetries;
      await this.submissionJobModel.updateOne(
        { _id: job._id },
        {
          $set: {
            status: shouldRetry ? 'pending' : 'failed',
            finishedAt: shouldRetry ? undefined : new Date(),
            result: shouldRetry
              ? null
              : {
                  passed: 0,
                  total: 0,
                  status: 'runtime_error',
                  failedCases: [
                    {
                      input: null,
                      expected: null,
                      error:
                        error instanceof Error ? error.message : String(error),
                    },
                  ],
                  executionTime: 0,
                  memoryUsed: 0,
                },
          },
          $inc: { retryCount: 1 },
          ...(shouldRetry ? { $unset: { startedAt: 1 } } : {}),
        },
      );
      if (!shouldRetry) {
        await this.submissionModel.updateOne(
          { _id: submissionId },
          {
            status: 'runtime_error',
            success: false,
            failedCases: [
              {
                input: null,
                expected: null,
                error: error instanceof Error ? error.message : String(error),
              },
            ],
          },
        );
      }
    }
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
        if (isMissingJudgeReturnValue(run.output)) {
          hasRuntimeError = true;
          failedCases.push({
            input,
            expected,
            output: null,
            error:
              'Submission produced no return value (undefined/null) after execution.',
          });
          continue;
        }
        const userOutput = jsonCloneForJudge(
          this.normalizeUnknownValue(run.output),
        );
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
