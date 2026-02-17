import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReaderController } from './reader.controller';
import { ReaderService } from './reader.service';
import { Book, BookSchema } from 'src/schemas/library/book/book.schema';
import { LibraryAsset, LibraryAssetSchema } from 'src/schemas/library/library-asset.schema';
import { BookProgress, BookProgressSchema } from 'src/schemas/library/book/book-progress.schema';
import { Guide, GuideSchema } from 'src/schemas/library/guide.schema';
import { Presentation, PresentationSchema } from 'src/schemas/library/presentation.schema';
import { S3Service } from 'src/utils/storage/s3.service';


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
  providers: [ReaderService,S3Service],
})
export class ReaderModule {}
