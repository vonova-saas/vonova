import { Module } from '@nestjs/common';
import { InstructorCvS3Service } from './instructor-cv-s3.service';

@Module({
  providers: [InstructorCvS3Service],
  exports: [InstructorCvS3Service],
})
export class StorageModule {}
