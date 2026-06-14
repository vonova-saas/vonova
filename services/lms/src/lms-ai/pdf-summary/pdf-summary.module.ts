import { Module } from '@nestjs/common';
import { PdfSummaryController } from './pdf-summary.controller';
import { PdfSummaryService } from './pdf-summary.service';
import { DatabaseModule } from '../database/database.module';
import { S3Service } from '../../common/services/s3.service';
import { AIUsageModule } from '../../ai-usage/ai-usage.module';

@Module({
  imports: [DatabaseModule, AIUsageModule],
  controllers: [PdfSummaryController],
  providers: [PdfSummaryService, S3Service],
  exports: [PdfSummaryService],
})
export class PdfSummaryModule {}
