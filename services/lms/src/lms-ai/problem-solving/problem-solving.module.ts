import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemSolvingController } from './problem-solving.controller';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { AiService } from './ai.service';
import { ProgressService } from './progress.service';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import { Problem, ProblemSchema } from './schemas/problem.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import {
  AIInteraction,
  AIInteractionSchema,
} from './schemas/ai-interaction.schema';
import { ProblemSolvingProgressSchema } from './schemas/problem-solving-progress.schema';
import { SubmissionJudgeQueue } from './submission-judge.queue';
import {
  SubmissionJob,
  SubmissionJobSchema,
} from './schemas/submission-job.schema';

const PROGRESS_MODEL = 'ProblemSolvingProgress';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Problem.name, schema: ProblemSchema },
        { name: Submission.name, schema: SubmissionSchema },
        { name: SubmissionJob.name, schema: SubmissionJobSchema },
        { name: AIInteraction.name, schema: AIInteractionSchema },
        {
          name: PROGRESS_MODEL,
          schema: ProblemSolvingProgressSchema,
        },
      ],
      'lms-ai',
    ),
  ],
  controllers: [ProblemSolvingController],
  providers: [
    ProblemService,
    SubmissionService,
    SubmissionJudgeQueue,
    AiService,
    ProgressService,
    ProblemSolvingAiClient,
  ],
})
export class ProblemSolvingModule {}
