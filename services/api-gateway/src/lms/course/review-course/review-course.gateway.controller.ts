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
import { ReviewCourseGatewayService } from './review-course.gateway.service';
import { CreateReviewCourseDto } from './dto/review.dto';

@ApiTags('LMS Course Reviews')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewCourseGatewayController {
  constructor(private readonly reviewService: ReviewCourseGatewayService) {}

  @ApiOperation({
    summary: 'Create course review',
    description:
      'Creates a new review for a course with rating and optional title and content.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        rating: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Excellent JavaScript Course!' },
        body: {
          type: 'string',
          example:
            'This course provided comprehensive coverage of JavaScript concepts.',
        },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data',
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
    description: 'Conflict - User has already reviewed this course',
  })
  @Post()
  async createReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewCourseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.reviewService.createReview(courseId, userId, dto),
    );
  }

  @Get()
  async getReviews(
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return firstValueFrom(this.reviewService.getReviews(courseId, page, limit));
  }

  @Get('my')
  async getMyReview(@Param('courseId') courseId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.reviewService.getMyReview(courseId, userId));
  }
}
