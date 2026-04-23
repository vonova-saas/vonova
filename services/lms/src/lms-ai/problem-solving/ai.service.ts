import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import {
  AIInteraction,
  AIInteractionDocument,
} from './schemas/ai-interaction.schema';
import { RequestHintDto, RequestSolutionDto } from './dto/ai.dto';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import { SubmissionService } from './submission.service';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressDocument,
} from './schemas/problem-solving-progress.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(AIInteraction.name, 'lms-ai')
    private readonly aiInteractionModel: Model<AIInteractionDocument>,
    @InjectModel(ProblemSolvingProgress.name, 'lms-ai')
    private readonly progressModel: Model<ProblemSolvingProgressDocument>,
    private readonly submissionService: SubmissionService,
    private readonly aiClient: ProblemSolvingAiClient,
  ) {}

  async requestHint(dto: RequestHintDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const progress = await this.ensureProgressState(userId, dto.problemId);
    if (progress.hintsUsed >= 3) {
      throw new ForbiddenException('Maximum 3 hints reached for this problem');
    }

    const level = (progress.hintsUsed + 1) as 1 | 2 | 3;
    const latestSubmission = await this.submissionService.getLatestSubmission(
      userId,
      dto.problemId,
    );
    const failedTestCase = latestSubmission?.failedTestCase
      ? JSON.stringify(latestSubmission.failedTestCase)
      : 'No failed testcase available';

    const normalizedHintLanguage = this.normalizeHintLanguage(dto.languageHint);

    const aiResponse = await this.aiClient.generateHint({
      problem: this.buildHintProblemText(
        level,
        problem.description,
        problem.constraints,
        normalizedHintLanguage,
      ),
      submit_code: dto.code,
      testCases: JSON.stringify(problem.testCases),
      testcase_fail: failedTestCase,
      language_hint: normalizedHintLanguage,
    });

    const interaction = await this.aiInteractionModel.create({
      userId,
      problemId: dto.problemId,
      type: 'hint',
      level,
      response: aiResponse,
    });

    const updatedProgress = await this.progressModel.findOneAndUpdate(
      {
        userId,
        problemId: dto.problemId,
        hintsUsed: { $lt: 3 },
      },
      {
        $inc: { hintsUsed: 1 },
        $push: {
          hints: {
            level,
            response: aiResponse,
            language: normalizedHintLanguage,
            createdAt: new Date(),
          },
        },
      },
      {
        new: true,
      },
    );

    if (!updatedProgress) {
      throw new ForbiddenException('Maximum 3 hints reached for this problem');
    }

    this.logger.log(
      `Hint generated for user=${userId} problem=${dto.problemId} level=${level}`,
    );
    return {
      ...interaction.toObject(),
      hintsUsed: updatedProgress.hintsUsed,
      hintsRemaining: Math.max(0, 3 - updatedProgress.hintsUsed),
      solutionUsed: updatedProgress.solutionUsed,
    };
  }

  async requestSolution(dto: RequestSolutionDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const progress = await this.ensureProgressState(userId, dto.problemId);
    if (progress.solutionUsed) {
      throw new ForbiddenException(
        'Solution already unlocked for this problem',
      );
    }

    const hasFailedSubmission =
      await this.submissionService.hasFailedSubmission(userId, dto.problemId);
    if (!hasFailedSubmission) {
      throw new BadRequestException(
        'Solution is allowed only after at least one failed submission',
      );
    }

    const aiResponse = await this.aiClient.generateSolution({
      problem: `${problem.title}\n${problem.description}\nConstraints:\n${problem.constraints}`,
      testCases: JSON.stringify(problem.testCases),
      language: dto.language || 'typescript',
      language_explanation: 'english',
    });

    const interaction = await this.aiInteractionModel.create({
      userId,
      problemId: dto.problemId,
      type: 'solution',
      response: aiResponse,
    });

    const updatedProgress = await this.progressModel.findOneAndUpdate(
      {
        userId,
        problemId: dto.problemId,
        solutionUsed: false,
      },
      {
        $set: { solutionUsed: true },
      },
      {
        new: true,
      },
    );

    if (!updatedProgress) {
      throw new ForbiddenException(
        'Solution already unlocked for this problem',
      );
    }

    this.logger.log(
      `Solution generated for user=${userId} problem=${dto.problemId}`,
    );
    return {
      ...interaction.toObject(),
      solutionUsed: updatedProgress.solutionUsed,
      hintsUsed: updatedProgress.hintsUsed,
      hintsRemaining: Math.max(0, 3 - updatedProgress.hintsUsed),
    };
  }

  async getHints(userId: string, problemId: string) {
    await this.ensureProblemExists(problemId);
    const progress = await this.ensureProgressState(userId, problemId);

    return {
      userId,
      problemId,
      hintsUsed: progress.hintsUsed,
      hintsRemaining: Math.max(0, 3 - progress.hintsUsed),
      solutionUsed: progress.solutionUsed,
      hints: progress.hints,
    };
  }

  private buildHintProblemText(
    level: 1 | 2 | 3,
    description: string,
    constraints: string,
    language: 'english' | 'arabic',
  ): string {
    const levelInstruction = {
      1: 'LEVEL 1: very general guidance, no code, no direct mistakes.',
      2: 'LEVEL 2: point to mistake and refer to failed test case.',
      3: 'LEVEL 3: explain approach, allow pseudo-code, no full solution.',
    }[level];

    const responseLanguageInstruction =
      language === 'arabic'
        ? 'IMPORTANT: Return the hint in Arabic only.'
        : 'IMPORTANT: Return the hint in English only.';

    return `${description}\nConstraints:\n${constraints}\n\n${levelInstruction}\n${responseLanguageInstruction}`;
  }

  private normalizeHintLanguage(languageHint?: string): 'english' | 'arabic' {
    const normalized = String(languageHint ?? '')
      .trim()
      .toLowerCase();

    if (
      normalized === 'arabic' ||
      normalized === 'ar' ||
      normalized === 'العربية'
    ) {
      return 'arabic';
    }

    return 'english';
  }

  private async ensureProblemExists(problemId: string) {
    const exists = await this.problemModel.exists({ _id: problemId });
    if (!exists) {
      throw new NotFoundException('Problem not found');
    }
  }

  private async ensureProgressState(userId: string, problemId: string) {
    const existing = await this.progressModel.findOne({ userId, problemId });
    if (existing) {
      return existing;
    }

    try {
      return await this.progressModel.create({
        userId,
        problemId,
        hintsUsed: 0,
        solutionUsed: false,
        hints: [],
      });
    } catch {
      const retried = await this.progressModel.findOne({ userId, problemId });
      if (!retried) {
        throw new BadRequestException(
          'Unable to initialize problem progress state',
        );
      }
      return retried;
    }
  }
}
