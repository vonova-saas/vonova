import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LibraryAsset, LibraryAssetSchema } from 'src/schemas/library/library-asset.schema';
import { Presentation, PresentationSchema } from 'src/schemas/library/presentation.schema';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { S3Service } from 'src/utils/storage/s3.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Presentation.name, schema: PresentationSchema },
      { name: LibraryAsset.name, schema: LibraryAssetSchema },
    ]),
  ],
  controllers: [PresentationController],
  providers: [PresentationService,S3Service],
})
export class PresentationModule {}
