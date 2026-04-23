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
import { AIInteraction, AIInteractionDocument } from './schemas/ai-interaction.schema';
import { RequestHintDto, RequestSolutionDto } from './dto/ai.dto';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import { SubmissionService } from './submission.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectModel(Problem.name, 'lms-ai')
    private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(AIInteraction.name, 'lms-ai')
    private readonly aiInteractionModel: Model<AIInteractionDocument>,
    private readonly submissionService: SubmissionService,
    private readonly aiClient: ProblemSolvingAiClient,
  ) {}

  async requestHint(dto: RequestHintDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const hintsCount = await this.aiInteractionModel.countDocuments({
      userId,
      problemId: dto.problemId,
      type: 'hint',
    });
    if (hintsCount >= 3) {
      throw new ForbiddenException('Maximum 3 hints reached for this problem');
    }

    const level = (hintsCount + 1) as 1 | 2 | 3;
    const latestSubmission = await this.submissionService.getLatestSubmission(
      userId,
      dto.problemId,
    );
    const failedTestCase = latestSubmission?.failedTestCase
      ? JSON.stringify(latestSubmission.failedTestCase)
      : 'No failed testcase available';

    const aiResponse = await this.aiClient.generateHint({
      problem: this.buildHintProblemText(
        level,
        problem.description,
        problem.constraints,
      ),
      submit_code: dto.code,
      testCases: JSON.stringify(problem.testCases),
      testcase_fail: failedTestCase,
      language_hint: dto.languageHint || 'english',
    });

    const interaction = await this.aiInteractionModel.create({
      userId,
      problemId: dto.problemId,
      type: 'hint',
      level,
      response: aiResponse,
    });

    this.logger.log(
      `Hint generated for user=${userId} problem=${dto.problemId} level=${level}`,
    );
    return interaction;
  }

  async requestSolution(dto: RequestSolutionDto, userId: string) {
    const problem = await this.problemModel.findById(dto.problemId).lean();
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const hasFailedSubmission = await this.submissionService.hasFailedSubmission(
      userId,
      dto.problemId,
    );
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

    this.logger.log(`Solution generated for user=${userId} problem=${dto.problemId}`);
    return interaction;
  }

  private buildHintProblemText(
    level: 1 | 2 | 3,
    description: string,
    constraints: string,
  ): string {
    const levelInstruction = {
      1: 'LEVEL 1: very general guidance, no code, no direct mistakes.',
      2: 'LEVEL 2: point to mistake and refer to failed test case.',
      3: 'LEVEL 3: explain approach, allow pseudo-code, no full solution.',
    }[level];

    return `${description}\nConstraints:\n${constraints}\n\n${levelInstruction}`;
  }
}

