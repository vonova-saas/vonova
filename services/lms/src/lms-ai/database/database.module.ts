import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { RoadmapSchema } from './schemas/roadmap.schema';
import { RoadmapHistorySchema } from './schemas/roadmap-history.schema';
import { PdfSummarySchema } from './schemas/pdf-summary.schema';
import { PdfChatHistorySchema } from './schemas/pdf-chat-history.schema';
import { AiAssistantSchema } from './schemas/ai-assistant.schema';
import { VideoGenSchema } from './schemas/video-gen.schema';
import { ProblemSolverSchema } from './schemas/problem-solver.schema';

import { RoadmapRepository } from './repositories/roadmap.repository';
import { RoadmapHistoryRepository } from './repositories/roadmap-history.repository';
import { PdfSummaryRepository } from './repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from './repositories/pdf-chat-history.repository';
import { LMS_AI_CONNECTION_NAME } from './constants';

const LMS_AI_CONNECTION = LMS_AI_CONNECTION_NAME;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: LMS_AI_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const roadmap = configService.get<string>('MONGO_URI_ROADMAP_AI');
        const pdfSummary = configService.get<string>(
          'MONGO_URI_PDF_SUMMARY_AI',
        );
        const remote = configService.get<string>('MONGO_URI_REMOTE');
        const lmsAi = configService.get<string>('MONGO_URI_LMS_AI');
        const raw = roadmap || pdfSummary;
        const isDockerHost =
          raw &&
          (raw.includes('mongodb://database:') ||
            raw.includes('mongodb://database/'));
        const uri = isDockerHost
          ? remote || lmsAi || 'mongodb://localhost:27017/'
          : raw || remote || lmsAi || 'mongodb://localhost:27017/';
        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature(
      [
        { name: 'Roadmap', schema: RoadmapSchema },
        { name: 'RoadmapHistory', schema: RoadmapHistorySchema },
        { name: 'PdfSummary', schema: PdfSummarySchema },
        { name: 'PdfChatHistory', schema: PdfChatHistorySchema },
        { name: 'AiAssistant', schema: AiAssistantSchema },
        { name: 'VideoGen', schema: VideoGenSchema },
        { name: 'ProblemSolver', schema: ProblemSolverSchema },
      ],
      LMS_AI_CONNECTION,
    ),
  ],
  providers: [
    RoadmapRepository,
    RoadmapHistoryRepository,
    PdfSummaryRepository,
    PdfChatHistoryRepository,
  ],
  exports: [
    RoadmapRepository,
    RoadmapHistoryRepository,
    PdfSummaryRepository,
    PdfChatHistoryRepository,
  ],
})
export class DatabaseModule {}
