import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PROBLEM_PATTERNS } from './constants/message-patterns';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { AiService } from './ai.service';
import { ProgressService } from './progress.service';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import {
  CreateProblemDto,
  DeleteProblemDto,
  ListProblemsDto,
} from './dto/problem.dto';
import {
  CreateProblemSheetDto,
  UpdateProblemSheetDto,
  CreateSheetPayloadDto,
  UpdateSheetPayloadDto,
} from './dto/problem-sheet.dto';
import { ProblemSheetService } from './problem-sheet.service';
import { CreateSubmissionDto } from './dto/submission.dto';
import { RequestHintDto, RequestSolutionDto } from './dto/ai.dto';
import {
  UpdateProblemProgressDto,
  UpdateSheetProgressDto,
} from './dto/progress.dto';
import { SheetProgressService } from './sheet-progress.service';
import { AiCreditService } from '../../ai-usage/ai-credit.service';

@Controller()
export class ProblemSolvingController {
  private readonly logger = new Logger(ProblemSolvingController.name);

  constructor(
    private readonly problemService: ProblemService,
    private readonly submissionService: SubmissionService,
    private readonly aiService: AiService,
    private readonly progressService: ProgressService,
    private readonly sheetProgressService: SheetProgressService,
    private readonly problemSheetService: ProblemSheetService,
    private readonly aiCreditService: AiCreditService,
  ) { }

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
  async listProblems(
    @Payload() data?: { dto?: ListProblemsDto; userId?: string },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.LIST} received`);
    return this.problemService.listProblems(data?.dto, data?.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.GET })
  async getProblem(
    @Payload() data: { id?: string; problemId?: string; userId?: string },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.GET} received`);
    return this.problemService.getProblem(
      data.id || data.problemId || '',
      data.userId,
    );
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
    return this.aiCreditService.executeWithCredits(
      data.userId,
      'PROBLEM_SOLVING',
      undefined,
      () => this.aiService.requestHint(data.dto, data.userId),
    );
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
    return this.aiCreditService.executeWithCredits(
      data.userId,
      'PROBLEM_SOLVING',
      undefined,
      () => this.aiService.requestSolution(data.dto, data.userId),
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.MARK_SOLVED })
  async markAsSolved(@Payload() data: { userId: string; problemId: string }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.MARK_SOLVED} received`);
    return this.progressService.markAsSolved(data.userId, data.problemId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.GET_SOLVED })
  async getSolvedProblems(@Payload() data: { userId: string }) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.GET_SOLVED} received`);
    return this.progressService.getSolvedProblems(data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.GET_PROBLEM_PROGRESS })
  getProblemProgress(@Payload() data: { userId: string; problemId: string }) {
    return this.progressService.getProblemProgress(data.userId, data.problemId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.PATCH_PROBLEM_PROGRESS })
  patchProblemProgress(
    @Payload()
    data: {
      userId: string;
      problemId: string;
      dto: UpdateProblemProgressDto;
    },
  ) {
    return this.progressService.updateProblemProgress(
      data.userId,
      data.problemId,
      data.dto,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.GET_SHEET_PROGRESS })
  getSheetProgress(@Payload() data: { userId: string; sheetId: string }) {
    return this.sheetProgressService.getSheetProgress(
      data.userId,
      data.sheetId,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.TOUCH_SHEET_PROGRESS })
  touchSheetProgress(
    @Payload()
    data: {
      userId: string;
      sheetId: string;
      dto?: UpdateSheetProgressDto;
    },
  ) {
    return this.sheetProgressService.touchSheet(
      data.userId,
      data.sheetId,
      data.dto?.currentProblemIndex,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_CREATE })
  createSheet(@Payload() data: CreateSheetPayloadDto) {
    return this.problemSheetService.create(data.dto, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_LIST })
  listSheets(
    @Payload()
    data?: {
      userId?: string;
      status?: 'draft' | 'published';
    },
  ) {
    return this.problemSheetService.list(data?.userId, data?.status);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_GET })
  getSheet(@Payload() data: { id: string; userId?: string }) {
    return this.problemSheetService.getById(data.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_UPDATE })
  updateSheet(
    @Payload()
    data: UpdateSheetPayloadDto,
  ) {
    return this.problemSheetService.update(data.id, data.dto, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_PUBLISH })
  publishSheet(@Payload() data: { id: string; userId: string }) {
    return this.problemSheetService.publish(data.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_UNPUBLISH })
  unpublishSheet(@Payload() data: { id: string; userId: string }) {
    return this.problemSheetService.unpublish(data.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_DUPLICATE })
  duplicateSheet(@Payload() data: { id: string; userId: string }) {
    return this.problemSheetService.duplicate(data.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_DELETE })
  deleteSheet(@Payload() data: { id: string; userId: string }) {
    return this.problemSheetService.remove(data.id, data.userId);
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_CREATE })
  async createProblemInSheet(
    @Payload() data: { userId: string; sheetId: string; dto: CreateProblemDto },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.SHEET_PROBLEM_CREATE} received`);
    return this.problemService.createProblemInSheet(
      data.dto,
      data.userId,
      data.sheetId,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_UPDATE })
  async updateSheetProblem(
    @Payload()
    data: {
      userId: string;
      sheetId: string;
      problemId: string;
      dto: Partial<CreateProblemDto>;
    },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.SHEET_PROBLEM_UPDATE} received`);
    return this.problemService.updateSheetProblem(
      data.sheetId,
      data.problemId,
      data.dto,
      data.userId,
    );
  }

  @MessagePattern({ cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_DELETE })
  async deleteSheetProblem(
    @Payload()
    data: { userId: string; sheetId: string; problemId: string },
  ) {
    this.logger.log(`NATS ${PROBLEM_PATTERNS.SHEET_PROBLEM_DELETE} received`);
    return this.problemService.deleteSheetProblem(
      data.sheetId,
      data.problemId,
      data.userId,
    );
  }
}
