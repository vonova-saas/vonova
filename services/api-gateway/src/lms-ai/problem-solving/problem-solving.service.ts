import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PROBLEM_PATTERNS } from './constants/message-patterns';
import {
  CreateProblemDto,
  CreateSubmissionDto,
  ListProblemsQueryDto,
  RequestHintDto,
  RequestSolutionDto,
  CreateProblemSheetDto,
  UpdateProblemSheetDto,
} from './dto/problem-solving.dto';

@Injectable()
export class ProblemSolvingGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) { }

  createProblem(userId: string, dto: CreateProblemDto) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.CREATE }, { userId, dto });
  }

  listProblems(filters?: ListProblemsQueryDto, userId?: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.LIST },
      { dto: filters ?? {}, userId },
    );
  }

  getProblem(id: string, userId?: string) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.GET }, { id, userId });
  }

  deleteProblem(userId: string, id: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.DELETE },
      { userId, dto: { id } },
    );
  }

  createSubmission(userId: string, dto: CreateSubmissionDto) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.SUBMIT }, { userId, dto });
  }

  getSubmissionStatus(userId: string, submissionId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SUBMIT_STATUS },
      { userId, submissionId },
    );
  }

  requestHint(userId: string, dto: RequestHintDto) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.AI_HINT }, { userId, dto });
  }

  getHints(userId: string, problemId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.AI_HINTS },
      { userId, problemId },
    );
  }

  requestSolution(userId: string, dto: RequestSolutionDto) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.AI_SOLUTION },
      { userId, dto },
    );
  }

  markAsSolved(userId: string, problemId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.MARK_SOLVED },
      { userId, problemId },
    );
  }

  getSolvedProblems(userId: string) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.GET_SOLVED }, { userId });
  }

  getProblemProgress(userId: string, problemId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.GET_PROBLEM_PROGRESS },
      { userId, problemId },
    );
  }

  patchProblemProgress(
    userId: string,
    problemId: string,
    dto: Record<string, unknown>,
  ) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.PATCH_PROBLEM_PROGRESS },
      { userId, problemId, dto },
    );
  }

  getSheetProgress(userId: string, sheetId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.GET_SHEET_PROGRESS },
      { userId, sheetId },
    );
  }

  touchSheetProgress(
    userId: string,
    sheetId: string,
    dto?: { currentProblemIndex?: number },
  ) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.TOUCH_SHEET_PROGRESS },
      { userId, sheetId, dto },
    );
  }

  createSheet(userId: string, dto: CreateProblemSheetDto) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_CREATE },
      { userId, dto },
    );
  }

  listSheets(userId?: string, status?: 'draft' | 'published') {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_LIST },
      { userId, status },
    );
  }

  getSheet(id: string, userId?: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_GET },
      { id, userId },
    );
  }

  updateSheet(id: string, userId: string, dto: UpdateProblemSheetDto) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_UPDATE },
      { id, userId, dto },
    );
  }

  publishSheet(id: string, userId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_PUBLISH },
      { id, userId },
    );
  }

  unpublishSheet(id: string, userId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_UNPUBLISH },
      { id, userId },
    );
  }

  duplicateSheet(id: string, userId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_DUPLICATE },
      { id, userId },
    );
  }

  deleteSheet(id: string, userId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_DELETE },
      { id, userId },
    );
  }

  createProblemInSheet(userId: string, sheetId: string, dto: CreateProblemDto) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_CREATE },
      { userId, sheetId, dto },
    );
  }

  updateSheetProblem(
    userId: string,
    sheetId: string,
    problemId: string,
    dto: Partial<CreateProblemDto>,
  ) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_UPDATE },
      { userId, sheetId, problemId, dto },
    );
  }

  deleteSheetProblem(userId: string, sheetId: string, problemId: string) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.SHEET_PROBLEM_DELETE },
      { userId, sheetId, problemId },
    );
  }
}
