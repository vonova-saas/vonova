import { Module } from '@nestjs/common';
import { PdfSummaryController } from './pdf-summary.controller';
import { PdfSummaryService } from './pdf-summary.service';
import { DatabaseModule } from '../database/database.module';
import { S3Service } from '../common/services/s3.service';
import { PdfSummaryGateway } from './pdf-summary.gateway';

@Module({
  imports: [DatabaseModule],
  controllers: [PdfSummaryController],
  providers: [
    PdfSummaryService,
    S3Service,
    PdfSummaryGateway
  ],
  exports: [PdfSummaryService],
})
export class PdfSummaryModule { }
