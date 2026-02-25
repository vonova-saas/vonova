import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@Injectable()
export class AssignmentGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createAssignment(dto: CreateAssignmentDto) {
    return this.client.send({ cmd: 'assignment.create' }, dto);
  }

  updateAssignment(id: string, dto: UpdateAssignmentDto) {
    return this.client.send({ cmd: 'assignment.update' }, { id, dto });
  }

  getAllAssignments() {
    return this.client.send({ cmd: 'assignment.getAll' }, {});
  }

  getAssignmentById(id: string) {
    return this.client.send({ cmd: 'assignment.getById' }, { id });
  }

  deleteAssignment(id: string) {
    return this.client.send({ cmd: 'assignment.delete' }, { id });
  }

  submitAssignment(assignmentId: string, dto: SubmitAssignmentDto) {
    return this.client.send(
      { cmd: 'assignment.submit' },
      {
        assignmentId,
        answers: dto.answers,
      },
    );
  }

  getAttempt(attemptId: string) {
    return this.client.send({ cmd: 'assignment.getAttempt' }, { attemptId });
  }

  getAttemptsForAssignment(assignmentId: string) {
    return this.client.send(
      { cmd: 'assignment.getAttemptsForAssignment' },
      { assignmentId },
    );
  }
}
