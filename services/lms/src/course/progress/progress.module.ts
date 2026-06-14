import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { EnrollModule } from '../enroll/enroll.module';
import {
  LessonProgress,
  LessonProgressSchema,
} from './schema/lesson-progress.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';
import { LessonProgressionEngine } from './lesson-progression.engine';
import {
  ProblemSheet,
  ProblemSheetSchema,
} from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import {
  SheetProgress,
  SheetProgressSchema,
} from '../../lms-ai/problem-solving/schemas/sheet-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';

@Module({
  imports: [
    EnrollModule,
    MongooseModule.forFeature([
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
    MongooseModule.forFeature(
      [
        { name: ProblemSheet.name, schema: ProblemSheetSchema },
        { name: SheetProgress.name, schema: SheetProgressSchema },
      ],
      LMS_AI_CONNECTION_NAME,
    ),
  ],
  controllers: [ProgressController],
  providers: [ProgressService, LessonProgressionEngine],
  exports: [LessonProgressionEngine],
})
export class ProgressModule {}
