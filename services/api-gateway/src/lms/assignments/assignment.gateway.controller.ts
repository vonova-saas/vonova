/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AssignmentGatewayService } from './assignment.gateway.service';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@Controller('api/v1/lms/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentGatewayController {
  constructor(private readonly assignmentService: AssignmentGatewayService) {}

  @Post()
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.assignmentService.createAssignment(dto));
  }

  @Patch(':id')
  async updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.assignmentService.updateAssignment(id, dto));
  }

  @Get()
  async getAllAssignments() {
    return firstValueFrom(this.assignmentService.getAllAssignments());
  }

  @Get(':id')
  async getAssignmentById(@Param('id') id: string) {
    return firstValueFrom(this.assignmentService.getAssignmentById(id));
  }

  @Delete(':id')
  async deleteAssignment(@Param('id') id: string, @Request() _req: any) {
    return firstValueFrom(this.assignmentService.deleteAssignment(id));
  }

  @Post(':assignmentId/submit')
  async submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return firstValueFrom(
      this.assignmentService.submitAssignment(assignmentId, dto),
    );
  }

  @Get('attempts/:attemptId')
  async getAttempt(@Param('attemptId') attemptId: string) {
    return firstValueFrom(this.assignmentService.getAttempt(attemptId));
  }

  @Get(':assignmentId/my-attempts')
  async getAttemptsForAssignment(@Param('assignmentId') assignmentId: string) {
    return firstValueFrom(
      this.assignmentService.getAttemptsForAssignment(assignmentId),
    );
  }
}
