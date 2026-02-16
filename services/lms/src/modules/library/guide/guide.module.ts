import { Module } from '@nestjs/common';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';
import { S3Service } from 'src/utils/storage/s3.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Guide, GuideSchema } from 'src/schemas/library/guide.schema';
import { LibraryAsset, LibraryAssetSchema } from 'src/schemas/library/library-asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guide.name, schema: GuideSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
    ]),
  ],
  controllers: [GuideController],
  providers: [GuideService, S3Service]
})
export class GuideModule {}
