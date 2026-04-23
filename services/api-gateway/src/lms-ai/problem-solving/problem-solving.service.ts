import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PROBLEM_PATTERNS } from './constants/message-patterns';
import {
  CreateProblemDto,
  CreateSubmissionDto,
  ListProblemsQueryDto,
  RequestHintDto,
  RequestSolutionDto,
} from './dto/problem-solving.dto';

@Injectable()
export class ProblemSolvingGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createProblem(userId: string, dto: CreateProblemDto) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.CREATE }, { userId, dto });
  }

  listProblems(filters?: ListProblemsQueryDto) {
    return this.client.send(
      { cmd: PROBLEM_PATTERNS.LIST },
      { dto: filters ?? {} },
    );
  }

  getProblem(id: string) {
    return this.client.send({ cmd: PROBLEM_PATTERNS.GET }, { id });
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
}
