import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LessonProgress, LessonProgressDocument } from 'src/schemas/course/lesson-progress.schema';
import { Lesson } from 'src/schemas/course/lesson.schema';
import { EnrollService } from '../enroll/enroll.service';


@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(Lesson.name)
    private lessonModel: Model<Lesson>,
    private enrollmentService: EnrollService,
  ) {}

  async markLessonComplete(courseId: string, lessonId: string, userId: string, completed = true, timeSpentSec?: number) {
    const enrolled = await this.enrollmentService.isEnrolled(courseId, userId);
    if (!enrolled) throw new ForbiddenException('You must be enrolled');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.lessonProgressModel.findOneAndUpdate(
      { userId, courseId, lessonId },
      {
        $set: {
          completed,
          completedAt: completed ? new Date() : undefined,
        },
        $inc: {
          timeSpentSec: timeSpentSec || 0,
        },
      },
      { new: true, upsert: true },
    );
  }

  async getMyCourseProgress(courseId: string, userId: string) {
    const [lessons, completed] = await Promise.all([
      this.lessonModel.countDocuments({ courseId }),
      this.lessonProgressModel.countDocuments({ courseId, userId, completed: true }),
    ]);

    return {
      completedLessons: completed,
      totalLessons: lessons,
      percent: lessons > 0 ? Math.round((completed / lessons) * 100) : 0,
    };
  }
}
