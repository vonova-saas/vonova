import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../schema/book/book.schema';
import { Guide, GuideSchema } from '../schema/guide.schema';
import {
  LibraryAsset,
  LibraryAssetSchema,
} from '../schema/library-asset.schema';
import {
  Presentation,
  PresentationSchema,
} from '../schema/presentation.schema';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from '../../common/utils/storage/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
      { name: Book.name, schema: BookSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService, S3Service],
  exports: [UploadService],
})
export class UploadModule {}
