import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PROBLEM_PATTERNS } from './constants/message-patterns';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { AiService } from './ai.service';
import {
  CreateProblemDto,
  DeleteProblemDto,
  ListProblemsDto,
} from './dto/problem.dto';
import { CreateSubmissionDto } from './dto/submission.dto';
import { RequestHintDto, RequestSolutionDto } from './dto/ai.dto';

@Controller()
export class ProblemSolvingController {
  private readonly logger = new Logger(ProblemSolvingController.name);

  constructor(
    private readonly problemService: ProblemService,
    private readonly submissionService: SubmissionService,
    private readonly aiService: AiService,
  ) {}

  @MessagePattern({ cmd: PROBLEM_PATTERNS.CREATE })
  async createProblem(
    @Payload() data: { userId: string; dto: CreateProblemDto },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.CREATE} received`);
    return this.problemService.createProblem(data.dto, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.DELETE })
  async deleteProblem(
    @Payload() data: { userId: string; dto: DeleteProblemDto },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.DELETE} received`);
    return this.problemService.deleteProblem(data.dto.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.LIST })
  async listProblems(@Payload() data?: { dto?: ListProblemsDto }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.LIST} received`);
    return this.problemService.listProblems(data?.dto);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.GET })
  async getProblem(@Payload() data: { id?: string; problemId?: string }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.GET} received`);
    return this.problemService.getProblem(data.id || data.problemId || '');
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SUBMIT })
  async createSubmission(
    @Payload() data: { userId: string; dto: CreateSubmissionDto },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.SUBMIT} received`);
    return this.submissionService.createSubmission(data.dto, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SUBMIT_STATUS })
  async getSubmissionStatus(
    @Payload() data: { userId: string; submissionId: string },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.SUBMIT_STATUS} received`);
    return this.submissionService.getSubmissionStatus(
      data.submissionId,
      data.userId,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.AI_HINT })
  async requestHint(@Payload() data: { userId: string; dto: RequestHintDto }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.AI_HINT} received`);
    return this.aiService.requestHint(data.dto, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.AI_HINTS })
  async getHints(@Payload() data: { userId: string; problemId: string }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.AI_HINTS} received`);
    return this.aiService.getHints(data.userId, data.problemId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.AI_SOLUTION })
  async requestSolution(
    @Payload() data: { userId: string; dto: RequestSolutionDto },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.AI_SOLUTION} received`);
    return this.aiService.requestSolution(data.dto, data.userId);
  }
}
