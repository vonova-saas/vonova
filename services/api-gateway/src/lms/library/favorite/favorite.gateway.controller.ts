/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Get, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FavoriteGatewayService } from './favorite.gateway.service';
import * as favoriteSchema from '../schema/favorite.schema';



@Controller('api/v1/lms/library/favorite')
@UseGuards(JwtAuthGuard)
export class FavoriteGatewayController {
  constructor(private readonly favoriteService: FavoriteGatewayService) {}

  @Post(':itemType/:itemId')
  async createFavorite(
    @Param('itemType') itemType: favoriteSchema.ItemType,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.favoriteService.toggleFavorite(itemType, itemId, userId));
  }

  @Get('me')
  async getMyFavorites(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.favoriteService.getMyFavorites(userId));
  }
}
