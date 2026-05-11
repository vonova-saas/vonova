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
  ) { }

  createAssignment(dto: CreateAssignmentDto, userId?: string) {
    return this.client.send({ cmd: 'assignment.create' }, { ...dto, userId });
  }

  createInstructorAssignment(dto: CreateAssignmentDto, userId: string) {
    return this.client.send({ cmd: 'assignment.createInstructor' }, { dto, userId });
  }

  updateAssignment(id: string, dto: UpdateAssignmentDto, userId?: string) {
    return this.client.send({ cmd: 'assignment.update' }, { id, dto, userId });
  }

  getAllAssignments(enrolledCourseIds?: string[]) {
    return this.client.send({ cmd: 'assignment.getAll' }, { enrolledCourseIds });
  }

  getInstructorAssignments(userId: string, courseId?: string) {
    return this.client.send({ cmd: 'assignment.getInstructorAssignments' }, { userId, courseId });
  }

  getAssignmentById(id: string, enrolledCourseIds?: string[]) {
    return this.client.send({ cmd: 'assignment.getById' }, { id, enrolledCourseIds });
  }

  deleteAssignment(id: string, userId?: string) {
    return this.client.send({ cmd: 'assignment.delete' }, { id, userId });
  }

  submitAssignment(assignmentId: string, dto: SubmitAssignmentDto, userId?: string, enrolledCourseIds?: string[]) {
    return this.client.send(
      { cmd: 'assignment.submit' },
      {
        assignmentId,
        answers: dto.answers,
        userId,
        enrolledCourseIds,
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
