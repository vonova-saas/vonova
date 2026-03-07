import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReaderController } from './reader.controller';
import { ReaderService } from './reader.service';
import { Book, BookSchema } from '../schema/book/book.schema';
import {
  LibraryAsset,
  LibraryAssetSchema,
} from '../schema/library-asset.schema';
import {
  BookProgress,
  BookProgressSchema,
} from '../schema/book/book-progress.schema';
import { Guide, GuideSchema } from '../schema/guide.schema';
import {
  Presentation,
  PresentationSchema,
} from '../schema/presentation.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
      { name: BookProgress.name, schema: BookProgressSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
    ]),
  ],
  controllers: [ReaderController],
  providers: [ReaderService, S3Service],
})
export class ReaderModule {}
