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
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CourseGatewayService } from './course.gateway.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';

@ApiTags('LMS Courses')
@ApiBearerAuth()
@Controller('api/v1/lms/courses')
@UseGuards(JwtAuthGuard)
export class CourseGatewayController {
  private readonly logger = new Logger(CourseGatewayController.name);

  constructor(private readonly courseService: CourseGatewayService) {}

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
  async createCourse(@Body() dto: CreateCourseDto, @Request() req: any) {
    const createdBy = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!createdBy) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(this.courseService.createCourse(dto, createdBy));
  }

  @ApiOperation({
    summary: 'Update course',
    description:
      'Updates an existing course with new information. Only the course owner can update.',
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
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(
      this.courseService.updateCourse(courseId, dto, ownerId),
    );
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
    
    return firstValueFrom(
      this.courseService.publishCourse(courseId, dto, ownerId),
    );
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
        message: { type: 'string', example: 'Course aggregates recomputed successfully' },
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
              title: { type: 'string', example: 'Complete JavaScript Masterclass' },
              slug: { type: 'string', example: 'complete-javascript-masterclass' },
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
  async getAllCourses(@Query() filters?: any) {
    return firstValueFrom(this.courseService.getAllCourses(filters));
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
  async getCourseBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.courseService.getCourseBySlug(slug));
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
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    title: { type: 'string', example: 'Variables and Data Types' },
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
  @Get(':courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    return firstValueFrom(this.courseService.getCourseById(courseId));
  }
}
