import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { CommunityS3Service } from './community-s3.service';

@Module({
  providers: [S3Service, CommunityS3Service],
  exports: [S3Service, CommunityS3Service],
})
export class AwsModule {}
