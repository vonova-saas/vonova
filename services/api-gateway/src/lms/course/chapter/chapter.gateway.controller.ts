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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChapterGatewayService } from './chapter.gateway.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
} from './dto/chapter.dto';

@ApiTags('LMS Course Chapters')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/chapters')
@UseGuards(JwtAuthGuard)
export class ChapterGatewayController {
  constructor(private readonly chapterService: ChapterGatewayService) {}

  @ApiOperation({
    summary: 'Create new chapter',
    description: 'Creates a new chapter within a specific course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Chapter created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Introduction to JavaScript' },
        index: { type: 'number', example: 0 },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid chapter data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Post()
  async createChapter(
    @Param('courseId') courseId: string,
    @Body() dto: CreateChapterDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.createChapter(courseId, dto));
  }

  @Patch(':chapterId')
  async updateChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpdateChapterDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(
      this.chapterService.updateChapter(courseId, chapterId, dto),
    );
  }

  @Delete(':chapterId')
  async deleteChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Request() _req: any,
  ) {
    return firstValueFrom(
      this.chapterService.deleteChapter(courseId, chapterId),
    );
  }

  @Patch('reorder')
  async reorderChapters(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderChaptersDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.reorderChapters(courseId, dto));
  }
}
