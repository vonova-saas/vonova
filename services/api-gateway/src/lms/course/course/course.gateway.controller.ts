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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
        categoryId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['javascript', 'web-development'],
        },
        thumbnailUrl: {
          type: 'string',
          example: 'https://example.com/thumbnail.jpg',
        },
        trailerUrl: {
          type: 'string',
          example: 'https://example.com/trailer.mp4',
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
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.createCourse(dto, ownerId));
  }

  @Patch(':courseId')
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.courseService.updateCourse(courseId, dto, ownerId),
    );
  }

  @Patch(':courseId/publish')
  async publishCourse(
    @Param('courseId') courseId: string,
    @Body() dto: PublishCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.courseService.publishCourse(courseId, dto, ownerId),
    );
  }

  @Delete(':courseId')
  async deleteCourse(@Param('courseId') courseId: string, @Request() req: any) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.deleteCourse(courseId, ownerId));
  }

  @Post(':courseId/recompute-aggregates')
  async recomputeAggregates(
    @Param('courseId') courseId: string,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.courseService.recomputeAggregates(courseId));
  }

  @Get()
  async getAllCourses(@Query() filters?: any) {
    return firstValueFrom(this.courseService.getAllCourses(filters));
  }

  @Get('slug/:slug')
  async getCourseBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.courseService.getCourseBySlug(slug));
  }

  @Get(':courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    return firstValueFrom(this.courseService.getCourseById(courseId));
  }
}
