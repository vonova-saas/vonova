import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Request,
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
import { ReviewGatewayService } from './review.gateway.service';
import { CreateOrUpdateReviewDto, ListReviewsQuery } from './dto/review.dto';

@ApiTags('LMS Library Reviews')
@ApiBearerAuth()
@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class ReviewGatewayController {
  constructor(private readonly reviewService: ReviewGatewayService) {}

  @ApiOperation({
    summary: 'Create or update review',
    description:
      'Creates a new review or updates an existing review for a library item (book, guide, or presentation).',
  })
  @ApiParam({
    name: 'itemType',
    description: 'Type of item being reviewed',
    example: 'BOOK',
  })
  @ApiParam({
    name: 'itemId',
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Review created or updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Review created or updated successfully',
        },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            itemType: { type: 'string', example: 'BOOK' },
            itemId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            rating: { type: 'number', example: 5 },
            title: { type: 'string', example: 'Excellent JavaScript Guide!' },
            body: {
              type: 'string',
              example: 'This guide provided comprehensive coverage...',
            },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
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
    description: 'Item not found',
  })
  @Post(':itemType/:itemId/reviews')
  async createOrUpdateReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Body() dto: CreateOrUpdateReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const review = await firstValueFrom(
      this.reviewService.createOrUpdateReview(itemType, itemId, userId, dto),
    );

    return { message: 'Review created or updated successfully', data: review };
  }

  @ApiOperation({
    summary: 'List reviews',
    description:
      'Retrieves a paginated list of reviews for a specific library item (book, guide, or presentation).',
  })
  @ApiParam({
    name: 'itemType',
    description: 'Type of item being reviewed',
    example: 'BOOK',
  })
  @ApiParam({
    name: 'itemId',
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of reviews per page',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews list fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Reviews list fetched successfully',
        },
        data: {
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  itemType: { type: 'string', example: 'BOOK' },
                  itemId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  rating: { type: 'number', example: 5 },
                  title: { type: 'string', example: 'Excellent JavaScript Guide!' },
                  body: {
                    type: 'string',
                    example: 'This guide provided comprehensive coverage...',
                  },
                  user: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'John Doe' },
                      avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
                    },
                  },
                  createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                  updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                total: { type: 'number', example: 50 },
                totalPages: { type: 'number', example: 3 },
              },
            },
            averageRating: { type: 'number', example: 4.5 },
            totalReviews: { type: 'number', example: 50 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  @Get(':itemType/:itemId/reviews')
  async listReviews(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await firstValueFrom(
      this.reviewService.listReviews(itemType, itemId, { page, limit }),
    );
    return { message: 'Reviews list fetched successfully', data };
  }

  @ApiOperation({
    summary: 'Get my review',
    description:
      'Retrieves the review written by the authenticated user for a specific library item.',
  })
  @ApiParam({
    name: 'itemType',
    description: 'Type of item being reviewed',
    example: 'BOOK',
  })
  @ApiParam({
    name: 'itemId',
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User review fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User review fetched successfully',
        },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            itemType: { type: 'string', example: 'BOOK' },
            itemId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            rating: { type: 'number', example: 5 },
            title: { type: 'string', example: 'Excellent JavaScript Guide!' },
            body: {
              type: 'string',
              example: 'This guide provided comprehensive coverage...',
            },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found or user has not reviewed the item',
  })
  @Get(':itemType/:itemId/reviews/me')
  async getMyReview(
    @Param('itemType') itemType: any,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const review = await firstValueFrom(
      this.reviewService.getMyReview(itemType, itemId, userId),
    );
    return { message: 'User review fetched successfully', data: review };
  }
}
