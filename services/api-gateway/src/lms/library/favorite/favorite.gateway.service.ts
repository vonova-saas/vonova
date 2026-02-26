import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ToggleFavoriteDto, ItemType } from './dto/favorite.dto';

@Injectable()
export class FavoriteGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  toggleFavorite(itemType: ItemType, itemId: string, userId: string) {
    return this.client.send({ cmd: 'library.favorite.toggle' }, { itemType, itemId, userId });
  }

  getMyFavorites(userId: string) {
    return this.client.send({ cmd: 'library.favorite.getMy' }, { userId });
  }
}
