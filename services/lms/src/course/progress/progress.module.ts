import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { EnrollModule } from '../enroll/enroll.module';
import { LessonProgress, LessonProgressSchema } from './schema/lesson-progress.schema';
import { Lesson, LessonSchema } from '../lesson/schema/lesson.schema';


@Module({
  imports: [
    EnrollModule,
    MongooseModule.forFeature([
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
