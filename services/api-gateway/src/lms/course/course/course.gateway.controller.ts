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
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { S3Service } from 'src/common/utils/storage/s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CourseGatewayService } from './course.gateway.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';
import { presignCourseThumbnailFields } from './course-thumbnail-presign.helper';
import { resolveRequesterUserId } from 'src/common/utils/request-user-id';

@ApiTags('LMS Courses')
@ApiBearerAuth()
@Controller('api/v1/lms/courses')
@UseGuards(JwtAuthGuard)
export class CourseGatewayController {
  private readonly logger = new Logger(CourseGatewayController.name);

  constructor(
    private readonly courseService: CourseGatewayService,
    private readonly s3Service: S3Service,
  ) { }

  @ApiOperation({
    summary: 'Create new course',
    description:
      'Creates a new course with title, pricing, and optional metadata.',
  })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Complete JavaScript Masterclass' },
        slug: { type: 'string', example: 'complete-javascript-masterclass' },
        smallDescription: {
          type: 'string',
          example: 'Learn JavaScript from scratch.',
        },
        description: {
          type: 'string',
          example: 'Comprehensive JavaScript course.',
        },
        difficulty: { type: 'string', example: 'Intermediate' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['javascript', 'web-development'],
        },
        thumbnailUrl: {
          type: 'string',
          example: 'https://example.com/thumbnail.jpg',
        },
        language: { type: 'string', example: 'English' },
        price: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 99.99 },
            currency: { type: 'string', example: 'USD' },
            isFree: { type: 'boolean', example: false },
          },
        },
        status: { type: 'string', example: 'DRAFT' },
        ownerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid course data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Post('createCourse')
  @UseInterceptors(FileInterceptor('image'))
  async createCourse(
    @Body() dto: CreateCourseDto,
    @Request() req: any,
    @UploadedFile() image?: Express.Multer.File
  ) {
    const createdBy = req.user?.id || req.user?.sub || req.user?._id;

    if (!createdBy) {
      throw new Error('Authentication required - No user found');
    }

    if (image) {
      const sanitized = image.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectKey = `courses/thumbnails/${Date.now()}_${sanitized}`;

      const uploadResult = await this.s3Service.uploadFileToLibrary(
        objectKey,
        image.buffer,
        image.mimetype,
      );

      dto.thumbnailUrl = uploadResult.location;
      dto.thumbnailKey = uploadResult.key;
    }

    const created = await firstValueFrom(
      this.courseService.createCourse(dto, createdBy),
    );
    if (created && typeof created === 'object' && 'data' in created) {
      const data = (created as { data?: Record<string, unknown> }).data;
      const signed = await presignCourseThumbnailFields(data, this.s3Service);
      return { ...(created as object), data: signed ?? data };
    }
    if (created && typeof created === 'object') {
      return presignCourseThumbnailFields(
        created as Record<string, unknown>,
        this.s3Service,
      );
    }
    return created;
  }

  @ApiOperation({
    summary: 'Update course',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Complete JavaScript Masterclass' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid course data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only course owner can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Patch(':courseId')
  @UseInterceptors(FileInterceptor('image'))
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: { data?: string },
    @Request() req: any,
    @UploadedFile() image?: Express.Multer.File
  ) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    // Parse the JSON data from the form field
    let dto: UpdateCourseDto = {};
    if (body.data) {
      try {
        dto = JSON.parse(body.data) as UpdateCourseDto;
      } catch (error) {
        throw new Error('Invalid JSON data provided');
      }
    }

    if (image) {
      const sanitized = image.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectKey = `courses/thumbnails/${Date.now()}_${sanitized}`;

      const uploadResult = await this.s3Service.uploadFileToLibrary(
        objectKey,
        image.buffer,
        image.mimetype,
      );

      dto.thumbnailUrl = uploadResult.location;
      dto.thumbnailKey = uploadResult.key;
    }

    const updated = await firstValueFrom(
      this.courseService.updateCourse(courseId, dto, ownerId),
    );
    if (updated && typeof updated === 'object' && 'data' in updated) {
      const data = (updated as { data?: Record<string, unknown> }).data;
      const signed = await presignCourseThumbnailFields(data, this.s3Service);
      return { ...(updated as object), data: signed ?? data };
    }
    if (updated && typeof updated === 'object') {
      return presignCourseThumbnailFields(
        updated as Record<string, unknown>,
        this.s3Service,
      );
    }
    return updated;
  }

  @ApiOperation({
    summary: 'Publish course',
    description:
      'Publishes or unpublishes a course, making it available or unavailable to students.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course publish status updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid publish data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only course owner can publish',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Patch(':courseId/publish')
  async publishCourse(
    @Param('courseId') courseId: string,
    @Body() dto: PublishCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    const published = await firstValueFrom(
      this.courseService.publishCourse(courseId, dto, ownerId),
    );
    if (published && typeof published === 'object' && 'data' in published) {
      const data = (published as { data?: Record<string, unknown> }).data;
      const signed = await presignCourseThumbnailFields(data, this.s3Service);
      return { ...(published as object), data: signed ?? data };
    }
    if (published && typeof published === 'object') {
      return presignCourseThumbnailFields(
        published as Record<string, unknown>,
        this.s3Service,
      );
    }
    return published;
  }

  @ApiOperation({
    summary: 'Delete course',
    description:
      'Permanently deletes a course and all its associated content. This action cannot be undone.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Course deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only course owner can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Delete(':courseId')
  async deleteCourse(@Param('courseId') courseId: string, @Request() req: any) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.courseService.deleteCourse(courseId, ownerId));
  }

  @ApiOperation({
    summary: 'Recompute course aggregates',
    description:
      'Recalculates course statistics including enrollment count, average rating, and progress data.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course aggregates recomputed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Course aggregates recomputed successfully',
        },
        enrollmentCount: { type: 'number', example: 150 },
        averageRating: { type: 'number', example: 4.5 },
        completionRate: { type: 'number', example: 0.75 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Post(':courseId/recompute-aggregates')
  async recomputeAggregates(
    @Param('courseId') courseId: string,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.courseService.recomputeAggregates(courseId));
  }

  @ApiOperation({
    summary: 'Get all courses',
    description:
      'Retrieves a list of courses with optional filtering by category, difficulty, status, etc.',
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by category ID',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'difficulty',
    description: 'Filter by difficulty level',
    required: false,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    example: 'INTERMEDIATE',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by publication status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'Complete JavaScript Masterclass',
              },
              slug: {
                type: 'string',
                example: 'complete-javascript-masterclass',
              },
              smallDescription: {
                type: 'string',
                example: 'Learn JavaScript from scratch.',
              },
              difficulty: { type: 'string', example: 'Intermediate' },
              price: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 99.99 },
                  currency: { type: 'string', example: 'USD' },
                  isFree: { type: 'boolean', example: false },
                },
              },
              status: { type: 'string', example: 'PUBLISHED' },
              enrollmentCount: { type: 'number', example: 150 },
              averageRating: { type: 'number', example: 4.5 },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @Get()
  async getAllCourses(@Query() filters?: any, @Request() req?: any) {
    const catalogUserId =
      req?.user?.id ?? req?.user?.sub ?? req?.user?._id;
    const result = await firstValueFrom(
      this.courseService.getAllCourses({
        ...(filters || {}),
        catalogUserId,
        applyCatalog: !(filters?.ownerId || filters?.instructorId),
      }),
    );
    if (result?.items && Array.isArray(result.items)) {
      const items = await Promise.all(
        result.items.map((c: Record<string, unknown>) =>
          presignCourseThumbnailFields(c, this.s3Service),
        ),
      );
      return { ...result, items };
    }
    return result;
  }

  @ApiOperation({
    summary: 'Get course by slug',
    description:
      'Retrieves a specific course using its URL-friendly slug identifier.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly slug of the course',
    example: 'complete-javascript-masterclass',
  })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Complete JavaScript Masterclass' },
        slug: { type: 'string', example: 'complete-javascript-masterclass' },
        description: {
          type: 'string',
          example: 'Comprehensive JavaScript course covering all fundamentals.',
        },
        difficulty: { type: 'string', example: 'Intermediate' },
        price: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 99.99 },
            currency: { type: 'string', example: 'USD' },
            isFree: { type: 'boolean', example: false },
          },
        },
        status: { type: 'string', example: 'PUBLISHED' },
        enrollmentCount: { type: 'number', example: 150 },
        averageRating: { type: 'number', example: 4.5 },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              index: { type: 'number', example: 0 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Get('slug/:slug')
  async getCourseBySlug(@Param('slug') slug: string, @Request() req: any) {
    const requesterId = resolveRequesterUserId(req);
    const course = await firstValueFrom(
      this.courseService.getCourseBySlug(slug, requesterId),
    );
    return presignCourseThumbnailFields(
      course as Record<string, unknown>,
      this.s3Service,
    );
  }

  @ApiOperation({
    summary: 'Get my courses (instructor only)',
    description:
      'Retrieves all courses created by the authenticated instructor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'Complete JavaScript Masterclass',
              },
              slug: {
                type: 'string',
                example: 'complete-javascript-masterclass',
              },
              status: { type: 'string', example: 'PUBLISHED' },
              price: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 99.99 },
                  currency: { type: 'string', example: 'USD' },
                  isFree: { type: 'boolean', example: false },
                },
              },
              enrollmentCount: { type: 'number', example: 150 },
              averageRating: { type: 'number', example: 4.5 },
              createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            },
          },
        },
        total: { type: 'number', example: 10 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get('my-courses')
  async getMyCourses(@Request() req: any) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    const result = await firstValueFrom(
      this.courseService.getMyCourses(ownerId),
    );
    if (result?.items && Array.isArray(result.items)) {
      const items = await Promise.all(
        result.items.map((c: Record<string, unknown>) =>
          presignCourseThumbnailFields(c, this.s3Service),
        ),
      );
      return { ...result, items };
    }
    return result;
  }

  @ApiOperation({
    summary: 'Get course by ID',
    description:
      'Retrieves a specific course using its unique identifier including full details and content structure.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Complete JavaScript Masterclass' },
        slug: { type: 'string', example: 'complete-javascript-masterclass' },
        description: {
          type: 'string',
          example: 'Comprehensive JavaScript course covering all fundamentals.',
        },
        difficulty: { type: 'string', example: 'Intermediate' },
        price: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 99.99 },
            currency: { type: 'string', example: 'USD' },
            isFree: { type: 'boolean', example: false },
          },
        },
        status: { type: 'string', example: 'PUBLISHED' },
        enrollmentCount: { type: 'number', example: 150 },
        averageRating: { type: 'number', example: 4.5 },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              index: { type: 'number', example: 0 },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    title: {
                      type: 'string',
                      example: 'Variables and Data Types',
                    },
                    index: { type: 'number', example: 0 },
                    durationMinutes: { type: 'number', example: 45 },
                    type: { type: 'string', example: 'VIDEO' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Get(':courseId/details')
  async getCourseDetails(@Param('courseId') courseId: string) {
    const raw = await firstValueFrom(
      this.courseService.getCourseDetails(courseId),
    );
    const payload = raw as {
      course: Record<string, unknown>;
      chaptersCount: number;
      lessonsCount: number;
      materialsCount: number;
      quizzesCount: number;
      problemsCount: number;
    };
    const course = await presignCourseThumbnailFields(
      payload.course,
      this.s3Service,
    );
    return {
      success: true,
      message: 'Course details loaded',
      data: {
        course,
        chaptersCount: payload.chaptersCount,
        lessonsCount: payload.lessonsCount,
        materialsCount: payload.materialsCount,
        quizzesCount: payload.quizzesCount,
        problemsCount: payload.problemsCount,
      },
    };
  }

  @Get(':courseId')
  async getCourseById(@Param('courseId') courseId: string, @Request() req: any) {
    const requesterId = resolveRequesterUserId(req);
    const course = await firstValueFrom(
      this.courseService.getCourseById(courseId, requesterId),
    );
    return presignCourseThumbnailFields(
      course as Record<string, unknown>,
      this.s3Service,
    );
  }
}
