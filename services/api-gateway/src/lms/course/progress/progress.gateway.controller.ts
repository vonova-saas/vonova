/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ProgressGatewayService } from './progress.gateway.service';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@ApiTags('LMS Course Progress')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId')
@UseGuards(JwtAuthGuard)
export class ProgressGatewayController {
  constructor(private readonly progressService: ProgressGatewayService) { }

  @ApiOperation({
    summary: 'Mark lesson as complete',
    description: 'Marks a specific lesson as completed for the authenticated user and tracks time spent.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson completion status updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        completed: { type: 'boolean', example: true },
        timeSpentSec: { type: 'number', example: 1800 },
        completedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid progress data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or lesson not found',
  })
  @Patch('lessons/:lessonId/complete')
  async markLessonComplete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkLessonCompleteDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.progressService.markLessonComplete(courseId, lessonId, userId, dto));
  }

  @Get('progress/me')
  async getMyCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.progressService.getMyCourseProgress(courseId, userId));
  }
}
