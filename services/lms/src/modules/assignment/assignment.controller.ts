import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto, SubmitAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post('addAssignment')
  async create(@Body() dto: CreateAssignmentDto) {
    const data = await this.assignmentService.createAssignment(dto, null);
    return { message: 'Assignment created successfully', data };
  }

  @Patch('updateAssignment/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    const data = await this.assignmentService.updateAssignment(id, dto);
    return { message: 'Assignment updated successfully', data };
  }

  @Get('getAllAssignments')
  async getAll() {
    const data = await this.assignmentService.getAllAssignments();
    return { message: 'Assignments retrieved successfully', data };
  }

  @Get('getAssignment/:id')
  async getById(@Param('id') id: string) {
    const data = await this.assignmentService.getAssignmentById(id);
    return { message: 'Assignment retrieved successfully', data };
  }

  @Delete('deleteAssignment/:id')
  async delete(@Param('id') id: string) {
    const data = await this.assignmentService.deleteAssignment(id);
    return { message: 'Assignment deleted successfully', data };
  }

  // submissions
  @Post(':assignmentId/submit')
  async submit(@Param('assignmentId') assignmentId: string, @Body() dto: SubmitAssignmentDto) {
    const result = await this.assignmentService.submitAssignmentAnswers(assignmentId, dto.answers);
    return { message: 'Assignment submitted successfully', data: result };
  }

  @Get('attempts/:attemptId')
  async getAttempt(@Param('attemptId') attemptId: string) {
    const data = await this.assignmentService.getUserAttempt(attemptId);
    return { message: 'Attempt retrieved successfully', data };
  }

  @Get(':assignmentId/my-attempts')
  async getAttempts(@Param('assignmentId') assignmentId: string) {
    const data = await this.assignmentService.getUserAttemptsForAssignment(assignmentId);
    return { message: 'Attempts retrieved successfully', data };
  }
}
