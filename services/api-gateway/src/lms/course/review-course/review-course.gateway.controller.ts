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
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReviewCourseGatewayService } from './review-course.gateway.service';
import { CreateReviewCourseDto } from './dto/review.dto';

@Controller('api/v1/lms/courses/:courseId/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewCourseGatewayController {
  constructor(private readonly reviewService: ReviewCourseGatewayService) {}

  @Post()
  async createReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewCourseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.reviewService.createReview(courseId, userId, dto));
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
  async getMyReview(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.reviewService.getMyReview(courseId, userId));
  }
}
