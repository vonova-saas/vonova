import { Module } from '@nestjs/common';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';
import { S3Service } from '../../common/utils/storage/s3.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Guide, GuideSchema } from '../schema/guide.schema';
import {
  LibraryAsset,
  LibraryAssetSchema,
} from '../schema/library-asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guide.name, schema: GuideSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
    ]),
  ],
  controllers: [GuideController],
  providers: [GuideService, S3Service],
})
export class GuideModule {}
