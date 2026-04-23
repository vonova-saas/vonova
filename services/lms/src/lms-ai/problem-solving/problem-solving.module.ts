import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemSolvingController } from './problem-solving.controller';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { AiService } from './ai.service';
import { ProblemSolvingAiClient } from './problem-solving.ai-client';
import { Problem, ProblemSchema } from './schemas/problem.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import {
  AIInteraction,
  AIInteractionSchema,
} from './schemas/ai-interaction.schema';
import {
  ProblemSolvingProgress,
  ProblemSolvingProgressSchema,
} from './schemas/problem-solving-progress.schema';
import { SubmissionJudgeQueue } from './submission-judge.queue';
import { SubmissionJob, SubmissionJobSchema } from './schemas/submission-job.schema';

@Module({
  imports: [
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
    ProblemSolvingAiClient,
  ],
})
export class ProblemSolvingModule {}
