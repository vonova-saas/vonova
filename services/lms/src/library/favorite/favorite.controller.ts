import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FavoriteService } from './favorite.service';
import type { ItemType } from '../schema/favorite.schema';

@Controller()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @MessagePattern({ cmd: 'library.favorite.toggle' })
  createFavorite(@Payload() data: { itemType: ItemType; itemId: string; userId: string }) {
    const { itemType, itemId, userId } = data;
    if (!itemType || !itemId || !userId) throw new Error('itemType, itemId and userId are required');

    return this.favoriteService.toggleFavorite(itemType, itemId, userId);
  }

  @MessagePattern({ cmd: 'library.favorite.getMy' })
  getMyFavorites(@Payload() data: { userId: string }) {
    const { userId } = data;
    if (!userId) throw new Error('userId is required');

    return this.favoriteService.getMyFavorites(userId);
  }
}