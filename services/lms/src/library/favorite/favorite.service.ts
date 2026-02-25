import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Book } from '../schema/book/book.schema';
import { Favorite, FavoriteDocument, ItemType } from '../schema/favorite.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';


@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel('Book') private bookModel: Model<Book>,
    @InjectModel('Guide') private guideModel: Model<Guide>,
    @InjectModel('Presentation') private presentationModel: Model<Presentation>,
  ) {}

  async toggleFavorite(itemType: ItemType, itemId: string, userId: string) {
    const existing = await this.favoriteModel.findOne({ userId, itemType, itemId });

    if (existing) {
      await this.favoriteModel.deleteOne({ userId, itemType, itemId });

      if (itemType === 'BOOK') {
        await this.bookModel.updateOne({ _id: itemId }, { $inc: { 'metrics.favoritesCount': -1 } }).catch(() => {});
      }else if(itemType === 'GUIDE') {
        await this.guideModel.updateOne({ _id: itemId }, { $inc: { 'metrics.favoritesCount': -1 } }).catch(() => {});
      }else if(itemType === 'PRESENTATION') {
        await this.presentationModel.updateOne({ _id: itemId }, { $inc: { 'metrics.favoritesCount': -1 } }).catch(() => {});
      }

      return { favorited: false };
    }

    await this.favoriteModel.updateOne(
      { userId, itemType, itemId },
      { $set: { userId, itemType, itemId } },
      { upsert: true }
    );

    if (itemType === 'BOOK') {
      await this.bookModel.updateOne({ _id: itemId }, { $inc: { 'metrics.favoritesCount': 1 } }).catch(() => {});
    }

    return { favorited: true };
  }

  async getMyFavorites(userId: string, type?: ItemType) {
    const filter: any = { userId };
    if (type) filter.itemType = type;

    const items = await this.favoriteModel.find(filter).sort({ createdAt: -1 });

    return items.map(f => ({
      itemType: f.itemType,
      itemId: String(f.itemId),
    }));
  }


}
