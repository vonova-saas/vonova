import { Module } from '@nestjs/common';
import { PdfSummaryController } from './pdf-summary.controller';
import { PdfSummaryService } from './pdf-summary.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PdfSummaryController],
  providers: [PdfSummaryService],
  exports: [PdfSummaryService],
})
export class PdfSummaryModule { }
