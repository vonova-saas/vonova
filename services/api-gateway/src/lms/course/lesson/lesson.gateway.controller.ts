/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LessonGatewayService } from './lesson.gateway.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
} from './dto/lesson.dto';

@ApiTags('LMS Course Lessons')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/chapters/:chapterId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonGatewayController {
  constructor(private readonly lessonService: LessonGatewayService) {}

  @ApiOperation({
    summary: 'Create new lesson',
    description: 'Creates a new lesson within a specific chapter of a course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'The unique identifier of the chapter',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        chapterId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Introduction to JavaScript Variables',
        },
        index: { type: 'number', example: 0 },
        durationMinutes: { type: 'number', example: 45 },
        type: { type: 'string', example: 'VIDEO' },
        previewable: { type: 'boolean', example: true },
        content: { type: 'string', example: 'Lesson content here...' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid lesson data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Post()
  async createLesson(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.lessonService.createLesson(courseId, chapterId, dto, ownerId),
    );
  }

  @Patch(':lessonId')
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.lessonService.updateLesson(courseId, lessonId, dto, ownerId),
    );
  }

  @Patch('reorder')
  async reorderLessons(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.lessonService.reorderLessons(courseId, dto, ownerId),
    );
  }

  @Delete(':lessonId')
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.lessonService.deleteLesson(courseId, lessonId, ownerId),
    );
  }
}
