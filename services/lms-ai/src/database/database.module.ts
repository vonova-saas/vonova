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

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('env.mongoUriRoadmapAi') || configService.get('MONGO_URI_ROADMAP_AI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'Roadmap', schema: RoadmapSchema },
      { name: 'RoadmapHistory', schema: RoadmapHistorySchema },
      { name: 'PdfSummary', schema: PdfSummarySchema },
      { name: 'PdfChatHistory', schema: PdfChatHistorySchema },
      { name: 'AiAssistant', schema: AiAssistantSchema },
      { name: 'VideoGen', schema: VideoGenSchema },
      { name: 'ProblemSolver', schema: ProblemSolverSchema },
    ]),
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
export class DatabaseModule { }
