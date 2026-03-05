import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { RoadmapSchema } from './schemas/roadmap.schema';
import { RoadmapHistorySchema } from './schemas/roadmap-history.schema';
import { PdfSummarySchema } from './schemas/pdf-summary.schema';
import { PdfChatHistorySchema } from './schemas/pdf-chat-history.schema';
import { PdfSummaryAudioSchema } from './schemas/pdf-summary-audio.schema';
import { AiAssistantSchema } from './schemas/ai-assistant.schema';
import { VideoGenSchema } from './schemas/video-gen.schema';
import { ProblemSolverSchema } from './schemas/problem-solver.schema';

import { RoadmapRepository } from './repositories/roadmap.repository';
import { RoadmapHistoryRepository } from './repositories/roadmap-history.repository';
import { PdfSummaryRepository } from './repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from './repositories/pdf-chat-history.repository';
import { PdfSummaryAudioRepository } from './repositories/pdf-summary-audio.repository';
import {
  LMS_AI_CONNECTION_NAME,
  PDF_SUMMARY_AI_AUDIO_CONNECTION_NAME,
} from './constants';

const LMS_AI_CONNECTION = LMS_AI_CONNECTION_NAME;
const PDF_SUMMARY_AI_AUDIO_CONNECTION = PDF_SUMMARY_AI_AUDIO_CONNECTION_NAME;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: LMS_AI_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const lmsAi = configService.get<string>('MONGO_URI_LMS_AI');

        const uri = lmsAi || 'mongodb://localhost:27017/LMS_AI';
        if (!uri) {
          throw new Error('MONGO_URI_LMS_AI is not set');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      connectionName: PDF_SUMMARY_AI_AUDIO_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const audioUri = configService.get<string>(
          'MONGO_URI_PDF_SUMMARY_AI_AUDIO',
        );
        const lmsAiUri = configService.get<string>('MONGO_URI_LMS_AI');

        return {
          uri:
            audioUri || lmsAiUri || 'mongodb://localhost:27017/LMS_AI',
        };
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
    MongooseModule.forFeature(
      [{ name: 'PdfSummaryAudio', schema: PdfSummaryAudioSchema }],
      PDF_SUMMARY_AI_AUDIO_CONNECTION,
    ),
  ],
  providers: [
    RoadmapRepository,
    RoadmapHistoryRepository,
    PdfSummaryRepository,
    PdfChatHistoryRepository,
    PdfSummaryAudioRepository,
  ],
  exports: [
    RoadmapRepository,
    RoadmapHistoryRepository,
    PdfSummaryRepository,
    PdfChatHistoryRepository,
    PdfSummaryAudioRepository,
  ],
})
export class DatabaseModule { }
