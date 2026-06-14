import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemSolvingController } from './problem-solving.controller';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { AiService } from './ai.service';
import { ProgressService } from './progress.service';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import { Problem, ProblemSchema } from './schemas/problem.schema';
import { ProblemSheet, ProblemSheetSchema } from './schemas/problem-sheet.schema';
import { ProblemSheetService } from './problem-sheet.service';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import {
  AIInteraction,
  AIInteractionSchema,
} from './schemas/ai-interaction.schema';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressSchema,
} from './schemas/problem-solving-progress.schema';
import {
  SheetProgress,
  SheetProgressSchema,
} from './schemas/sheet-progress.schema';
import {
  SheetProgressSnapshot,
  SheetProgressSnapshotSchema,
} from './schemas/sheet-progress-snapshot.schema';
import { SheetProgressService } from './sheet-progress.service';
import { SubmissionJudgeQueue } from './submission-judge.queue';
import {
  SubmissionJob,
  SubmissionJobSchema,
} from './schemas/submission-job.schema';
import { EnrollModule } from '../../course/enroll/enroll.module';
import { AIUsageModule } from '../../ai-usage/ai-usage.module';

@Module({
  imports: [
    EnrollModule,
    AIUsageModule,
    MongooseModule.forFeature(
      [
        { name: Problem.name, schema: ProblemSchema },
        { name: Submission.name, schema: SubmissionSchema },
        { name: SubmissionJob.name, schema: SubmissionJobSchema },
        { name: AIInteraction.name, schema: AIInteractionSchema },
        {
          name: ProblemSolvingProgress.name,
          schema: ProblemSolvingProgressSchema,
        },
        { name: SheetProgress.name, schema: SheetProgressSchema },
        { name: SheetProgressSnapshot.name, schema: SheetProgressSnapshotSchema },
        { name: ProblemSheet.name, schema: ProblemSheetSchema },
      ],
      'lms-ai',
    ),
  ],
  controllers: [ProblemSolvingController],
  providers: [
    ProblemSheetService,
    ProblemService,
    SubmissionService,
    SubmissionJudgeQueue,
    AiService,
    ProgressService,
    SheetProgressService,
    ProblemSolvingAiClient,
  ],
  exports: [ProgressService, SheetProgressService],
})
export class ProblemSolvingModule { }
