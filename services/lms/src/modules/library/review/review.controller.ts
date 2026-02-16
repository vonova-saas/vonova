import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateOrUpdateReviewDto, ListReviewsQuery } from './dto/review.dto';

@Controller('/library/items')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':itemType/:itemId/reviews')
  async createOrUpdateReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Body() dto: CreateOrUpdateReviewDto,
  ) {
    const review = await this.reviewService.createOrUpdate(
      itemType,
      itemId,
      dto.userId ,// TODO: replace with req.user.id when auth is enabled
      dto.rating,
      dto.title,
      dto.body,
    );

    return { message: 'Review created or updated successfully', data: review };
  }

  @Get(':itemType/:itemId/reviews')
  async listReviews(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.reviewService.list(itemType, itemId, page, limit);
    return { message: 'Reviews list fetched successfully', data };
  }

  @Get(':itemType/:itemId/reviews/me')
  async getMyReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
  ) {
    const review = await this.reviewService.getMy(
      itemType,
      itemId,
      'USER_ID_HERE', // TODO: replace with req.user.id
    );

    return { message: 'User review fetched successfully', data: review };
  }
}
