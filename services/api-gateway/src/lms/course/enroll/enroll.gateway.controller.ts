/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { EnrollGatewayService } from './enroll.gateway.service';
import { EnrollCourseDto } from './dto/enroll.dto';

@ApiTags('LMS Course Enrollment')
@ApiBearerAuth()
@Controller('api/v1/lms/courses')
@UseGuards(JwtAuthGuard)
export class EnrollGatewayController {
  constructor(private readonly enrollService: EnrollGatewayService) {}

  @ApiOperation({
    summary: 'Enroll in a course',
    description:
      'Enrolls the authenticated user in a specific course with optional coupon code.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully enrolled in course',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        enrolledAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        status: { type: 'string', example: 'ACTIVE' },
        progress: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid enrollment data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Already enrolled in course',
  })
  @Post(':courseId/enroll')
  async enrollCourse(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollCourseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const createdBy = userId;
    return firstValueFrom(
      this.enrollService.enrollCourse(courseId, userId, createdBy, dto),
    );
  }

  @ApiOperation({
    summary: 'Get enrollment status',
    description:
      'Retrieves the enrollment status and details for a specific course and user.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        enrolledAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        status: { type: 'string', example: 'ACTIVE' },
        progress: { type: 'number', example: 0.65 },
        completedLessons: { type: 'number', example: 13 },
        totalLessons: { type: 'number', example: 20 },
        lastAccessedAt: { type: 'string', example: '2023-01-15T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or enrollment not found',
  })
  @Get(':courseId/enrollment')
  async getEnrollment(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.getEnrollment(courseId, userId));
  }

  @ApiOperation({
    summary: 'Get lesson access',
    description:
      'Checks if the enrolled user has access to a specific lesson within a course.',
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
    description: 'Lesson access status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean', example: true },
        isPreviewable: { type: 'boolean', example: false },
        isEnrolled: { type: 'boolean', example: true },
        enrollmentStatus: { type: 'string', example: 'ACTIVE' },
        lessonCompleted: { type: 'boolean', example: false },
        nextLessonAvailable: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to lesson',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, lesson, or enrollment not found',
  })
  @Get(':courseId/lessons/:lessonId/access')
  async getLessonAccess(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.enrollService.getLessonAccess(courseId, lessonId, userId),
    );
  }
}
