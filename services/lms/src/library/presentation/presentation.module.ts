import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LibraryAsset,
  LibraryAssetSchema,
} from '../schema/library-asset.schema';
import {
  Presentation,
  PresentationSchema,
} from '../schema/presentation.schema';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { S3Service } from '../../common/utils/storage/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Presentation.name, schema: PresentationSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
    ]),
  ],
  controllers: [PresentationController],
  providers: [PresentationService, S3Service],
})
export class PresentationModule {}
