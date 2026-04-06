import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { RoadmapSchema } from './schemas/roadmap.schema';
import { RoadmapHistorySchema } from './schemas/roadmap-history.schema';
import { PdfSummarySchema } from './schemas/pdf-summary.schema';
import { PdfChatHistorySchema } from './schemas/pdf-chat-history.schema';
import { PdfSummaryAudioSchema } from './schemas/pdf-summary-audio.schema';
import { VoiceAskIdempotencySchema } from './schemas/voice-ask-idempotency.schema';
import { AiAssistantSchema } from './schemas/ai-assistant.schema';
import { VideoGenSchema } from './schemas/video-gen.schema';
import { ProblemSolverSchema } from './schemas/problem-solver.schema';

import { RoadmapRepository } from './repositories/roadmap.repository';
import { RoadmapHistoryRepository } from './repositories/roadmap-history.repository';
import { PdfSummaryRepository } from './repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from './repositories/pdf-chat-history.repository';
import { PdfSummaryAudioRepository } from './repositories/pdf-summary-audio.repository';
import { VoiceAskIdempotencyRepository } from './repositories/voice-ask-idempotency.repository';
import { LMS_AI_CONNECTION_NAME } from './constants';

const LMS_AI_CONNECTION = LMS_AI_CONNECTION_NAME;

function pickUri(configService: ConfigService, key: string): string | undefined {
  const v = configService.get<string>(key)?.trim();
  return v && v.length > 0 ? v : undefined;
}

function resolveLmsAiMongoUri(configService: ConfigService): string {
  const uri =
    pickUri(configService, 'MONGO_URI_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_REMOTE_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_ROADMAP_AI_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_PDF_SUMMARY_AI_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_PDF_SUMMARY_AI_AUDIO_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_ASSISTANT_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_PROBLEM_SOLVER_LMS_AI') ||
    pickUri(configService, 'MONGO_URI_VIDEO_GEN_LMS_AI');

  if (uri) return uri;

  const nodeEnv = configService.get<string>('NODE_ENV')?.trim().toLowerCase();
  const local = pickUri(configService, 'MONGO_URI_LOCAL_LMS');
  const remote = pickUri(configService, 'MONGO_URI_REMOTE_LMS');
  const fallback =
    nodeEnv === 'development' ? local || remote : remote || local;
  if (fallback) return fallback;

  throw new Error(
    'LMS-AI Mongo URI is not set. Set MONGO_URI_LMS_AI, MONGO_URI_REMOTE_LMS_AI, any MONGO_URI_*_LMS_AI feature URI, or MONGO_URI_LOCAL_LMS / MONGO_URI_REMOTE_LMS (same as main LMS).',
  );
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: LMS_AI_CONNECTION,
      useFactory: (configService: ConfigService) => {
        return { uri: resolveLmsAiMongoUri(configService) };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature(
      [
        { name: 'Roadmap', schema: RoadmapSchema },
        { name: 'RoadmapHistory', schema: RoadmapHistorySchema },
        { name: 'PdfSummary', schema: PdfSummarySchema },
        { name: 'PdfChatHistory', schema: PdfChatHistorySchema },
        { name: 'PdfSummaryAudio', schema: PdfSummaryAudioSchema },
        { name: 'VoiceAskIdempotency', schema: VoiceAskIdempotencySchema },
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
    PdfSummaryAudioRepository,
    VoiceAskIdempotencyRepository,
  ],
  exports: [
    RoadmapRepository,
    RoadmapHistoryRepository,
    PdfSummaryRepository,
    PdfChatHistoryRepository,
    PdfSummaryAudioRepository,
    VoiceAskIdempotencyRepository,
  ],
})
export class DatabaseModule { }
