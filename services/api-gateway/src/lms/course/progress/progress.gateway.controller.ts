/* eslint-disable @typescript-eslint/no-unsafe-argument */

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
  constructor(private readonly progressService: ProgressGatewayService) {}

  @ApiOperation({
    summary: 'Mark lesson as complete',
    description:
      'Marks a specific lesson as completed for the authenticated user and tracks time spent.',
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
    const userId = req.user?._id || req.user?.id || req.user?.sub;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    const createdBy = userId;
    return firstValueFrom(
      this.progressService.markLessonComplete(
        courseId,
        lessonId,
        userId,
        createdBy,
        dto,
      ),
    );
  }

  @ApiOperation({
    summary: 'Get course progress',
    description:
      'Retrieves the overall progress of the authenticated user for a specific course including completed lessons and time spent.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course progress retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        overallProgress: { type: 'number', example: 0.65 },
        completedLessons: { type: 'number', example: 13 },
        totalLessons: { type: 'number', example: 20 },
        totalTimeSpent: { type: 'number', example: 7200 },
        lastAccessedAt: { type: 'string', example: '2023-01-15T00:00:00.000Z' },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chapterId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              progress: { type: 'number', example: 1.0 },
              completedLessons: { type: 'number', example: 5 },
              totalLessons: { type: 'number', example: 5 },
            },
          },
        },
        nextLesson: {
          type: 'object',
          properties: {
            lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Advanced JavaScript Concepts' },
            chapterTitle: { type: 'string', example: 'Advanced Topics' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or progress not found',
  })
  @Get(['progress/me', 'progress'])
  async getMyCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?._id || req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.progressService.getMyCourseProgress(courseId, userId),
    );
  }
}
