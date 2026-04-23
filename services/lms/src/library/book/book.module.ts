import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from '../schema/book/book.schema';
import {
  BookProgress,
  BookProgressSchema,
} from '../schema/book/book-progress.schema';
import { LibraryAsset, LibraryAssetSchema } from '../schema/library-asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: BookProgress.name, schema: BookProgressSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
    ]),
  ],
  controllers: [BookController],
  providers: [BookService, S3Service],
  exports: [BookService],
})
export class BookModule {}
