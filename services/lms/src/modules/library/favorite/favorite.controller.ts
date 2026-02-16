import { Controller, Post, Delete, Param, Get, Query, Body } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { ItemType } from 'src/schemas/library/favorite.schema';


@Controller('/library/favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('/:itemType/:itemId')
  createFavorite(
    @Param('itemType') itemType: ItemType,
    @Param('itemId') itemId: string,
    @Body('userId') userId: string
  ) {
    return this.favoriteService.toggleFavorite(itemType, itemId, userId);
  }

  @Get('/me')
  getMyFavorites(@Query('userId') userId: string) {
    return this.favoriteService.getMyFavorites(userId);
  }


}
