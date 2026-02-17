import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ReviewCourseService } from './review-course.service';
import { CreateReviewCourseDto } from './dto/review.dto';


@Controller('courses/:courseId/reviews')
export class ReviewCourseController {
  constructor(private readonly reviewService: ReviewCourseService) {}

  @Post()
  async createReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewCourseDto,
  ) {
    const userId = 'mockUserId'; 
    const review = await this.reviewService.createReview(courseId, userId, dto.rating, dto.title, dto.body);
    return { message: 'Review saved', data: review };
  }

  @Get()
  async getReviews(
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.reviewService.getReviews(courseId, Number(page) || 1, Number(limit) || 20);
    return { message: 'Course reviews', data: result };
  }

  @Get('me')
  async getMyReview(@Param('courseId') courseId: string) {
    const userId = 'mockUserId'; 
    const review = await this.reviewService.getMyReview(courseId, userId);
    return { message: 'My review', data: review };
  }
}
