/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  Logger,
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
import { ChapterGatewayService } from './chapter.gateway.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
  PaginationDto,
  ChaptersPaginatedResponseDto,
} from './dto/chapter.dto';

@ApiTags('LMS Course Chapters')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/chapters')
@UseGuards(JwtAuthGuard)
export class ChapterGatewayController {
  private readonly logger = new Logger(ChapterGatewayController.name);

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
    @Request() req: any,
  ) {
    console.log('Create chapter request user:', req.user);
    const createdBy =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!createdBy) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    console.log('Creating chapter with createdBy:', createdBy);
    return firstValueFrom(
      this.chapterService.createChapter(courseId, dto, createdBy),
    );
  }

  @ApiOperation({
    summary: 'Update chapter',
    description:
      'Updates an existing chapter with new information within a specific course.',
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
    status: 200,
    description: 'Chapter updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Introduction to JavaScript' },
        index: { type: 'number', example: 0 },
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
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Patch('reorder')
  async reorderChapters(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderChaptersDto,
    @Request() req: any,
  ) {
    console.log('Reorder chapters request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    // Validate courseId format
    if (!/^[0-9a-fA-F]{24}$/.test(courseId)) {
      throw new Error(`Invalid courseId format: ${courseId}`);
    }

    console.log('Gateway reorder chapters payload:', {
      courseId,
      dto,
      ownerId,
    });

    return firstValueFrom(
      this.chapterService.reorderChapters(courseId, dto, ownerId),
    );
  }

  @ApiOperation({
    summary: 'Update chapter',
    description:
      'Updates an existing chapter with new information within a specific course.',
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
    status: 200,
    description: 'Chapter updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Introduction to JavaScript' },
        index: { type: 'number', example: 0 },
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
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Patch(':chapterId')
  async updateChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpdateChapterDto,
    @Request() req: any,
  ) {
    console.log('Update chapter request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.chapterService.updateChapter(courseId, chapterId, dto, ownerId),
    );
  }

  @ApiOperation({
    summary: 'Get all chapters with pagination',
    description: 'Retrieves all chapters for a course with pagination support.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapters retrieved successfully',
    type: ChaptersPaginatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Get()
  async getAllChapters(
    @Param('courseId') courseId: string,
    @Query() pagination: PaginationDto,
  ) {
    return firstValueFrom(
      this.chapterService.getAllChapters(courseId, pagination),
    );
  }

  @ApiOperation({
    summary: 'Get chapter by ID',
    description: 'Retrieves a specific chapter by its ID within a course.',
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
    status: 200,
    description: 'Chapter retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Introduction to JavaScript' },
        index: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Get(':chapterId')
  async getChapterById(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return firstValueFrom(
      this.chapterService.getChapterById(courseId, chapterId),
    );
  }

  @ApiOperation({
    summary: 'Delete chapter',
    description:
      'Permanently deletes a chapter and all its associated lessons from a course.',
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
    status: 200,
    description: 'Chapter deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Chapter deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Delete(':chapterId')
  async deleteChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Request() req: any,
  ) {
    console.log('Delete chapter request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.chapterService.deleteChapter(courseId, chapterId, ownerId),
    );
  }
}
