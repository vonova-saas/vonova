import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from '../schema/favorite.schema';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { BookSchema } from '../schema/book/book.schema';
import { GuideSchema } from '../schema/guide.schema';
import { PresentationSchema } from '../schema/presentation.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: 'Book', schema: BookSchema },
      { name: 'Guide', schema: GuideSchema },
      { name: 'Presentation', schema: PresentationSchema },
    ]),
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
