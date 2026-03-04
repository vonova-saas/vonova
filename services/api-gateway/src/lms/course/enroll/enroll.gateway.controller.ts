/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  constructor(private readonly enrollService: EnrollGatewayService) { }

  @ApiOperation({
    summary: 'Enroll in a course',
    description: 'Enrolls the authenticated user in a specific course with optional coupon code.',
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
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.enrollCourse(courseId, userId, dto));
  }

  @Get(':courseId/enrollment')
  async getEnrollment(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.getEnrollment(courseId, userId));
  }

  @Get(':courseId/lessons/:lessonId/access')
  async getLessonAccess(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.getLessonAccess(courseId, lessonId, userId));
  }
}
