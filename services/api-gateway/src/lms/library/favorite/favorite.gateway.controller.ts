/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
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
import { FavoriteGatewayService } from './favorite.gateway.service';
import * as favoriteSchema from '../schema/favorite.schema';

@ApiTags('LMS Library Favorites')
@ApiBearerAuth()
@Controller('api/v1/lms/library/favorite')
@UseGuards(JwtAuthGuard)
export class FavoriteGatewayController {
  constructor(private readonly favoriteService: FavoriteGatewayService) {}

  @ApiOperation({
    summary: 'Toggle favorite status',
    description:
      "Adds or removes an item (book, guide, or presentation) from the user's favorites.",
  })
  @ApiParam({
    name: 'itemType',
    description: 'Type of item to favorite',
    enum: ['BOOK', 'GUIDE', 'PRESENTATION'],
    example: 'BOOK',
  })
  @ApiParam({
    name: 'itemId',
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        itemType: { type: 'string', example: 'BOOK' },
        itemId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid item type or ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  @Post(':itemType/:itemId')
  async createFavorite(
    @Param('itemType') itemType: favoriteSchema.ItemType,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.favoriteService.toggleFavorite(itemType, itemId, userId),
    );
  }

  @ApiOperation({
    summary: 'Get user favorites',
    description: 'Retrieves all favorite items for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User favorites retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          itemType: { type: 'string', example: 'BOOK' },
          itemId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          item: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                example: 'JavaScript: The Complete Guide',
              },
              coverUrl: {
                type: 'string',
                example: 'https://example.com/cover.jpg',
              },
            },
          },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get('me')
  async getMyFavorites(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.favoriteService.getMyFavorites(userId));
  }
}
