import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) { }

  @MessagePattern({ cmd: 'assignment.create' })
  async create(
    @Payload() dto: CreateAssignmentDto,
    @Payload('userId') userId?: string,
  ) {
    const data = await this.assignmentService.createAssignment(dto, userId);
    return { message: 'Assignment created successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.createInstructor' })
  async createInstructor(
    @Payload('dto') dto: CreateAssignmentDto,
    @Payload('userId') userId: string,
  ) {
    const data = await this.assignmentService.createAssignment(dto, userId);
    return { message: 'Assignment created successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.update' })
  async update(
    @Payload('id') id: string,
    @Payload('dto') dto: UpdateAssignmentDto,
    @Payload('userId') userId?: string,
  ) {
    const data = await this.assignmentService.updateAssignment(id, dto, userId);
    return { message: 'Assignment updated successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.getAll' })
  async getAll(
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    const data = await this.assignmentService.getAllAssignments(enrolledCourseIds);
    return { message: 'Assignments retrieved successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.getInstructorAssignments' })
  async getInstructorAssignments(
    @Payload('userId') userId: string,
    @Payload('courseId') courseId?: string,
  ) {
    const data = await this.assignmentService.getInstructorAssignments(userId, courseId);
    return { message: 'Assignments retrieved successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.getById' })
  async getById(
    @Payload('id') id: string,
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    const data = await this.assignmentService.getAssignmentById(id, enrolledCourseIds);
    return { message: 'Assignment retrieved successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.delete' })
  async delete(
    @Payload('id') id: string,
    @Payload('userId') userId?: string,
  ) {
    const data = await this.assignmentService.deleteAssignment(id, userId);
    return { message: 'Assignment deleted successfully', data };
  }

  // submissions
  @MessagePattern({ cmd: 'assignment.submit' })
  async submit(
    @Payload('assignmentId') assignmentId: string,
    @Payload('answers') dto: SubmitAssignmentDto['answers'],
    @Payload('userId') userId?: string,
    @Payload('enrolledCourseIds') enrolledCourseIds?: string[],
  ) {
    const result = await this.assignmentService.submitAssignmentAnswers(
      assignmentId,
      dto,
      userId,
      enrolledCourseIds,
    );
    return { message: 'Assignment submitted successfully', data: result };
  }

  @MessagePattern({ cmd: 'assignment.getAttempt' })
  async getAttempt(@Payload('attemptId') attemptId: string) {
    const data = await this.assignmentService.getUserAttempt(attemptId);
    return { message: 'Attempt retrieved successfully', data };
  }

  @MessagePattern({ cmd: 'assignment.getAttemptsForAssignment' })
  async getAttempts(@Payload('assignmentId') assignmentId: string) {
    const data =
      await this.assignmentService.getUserAttemptsForAssignment(assignmentId);
    return { message: 'Attempts retrieved successfully', data };
  }
}
