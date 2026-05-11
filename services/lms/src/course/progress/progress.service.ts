import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LessonProgress,
  LessonProgressDocument,
} from './schema/lesson-progress.schema';
import { Lesson, LessonDocument } from '../lesson/schema/lesson.schema';
import { EnrollService } from '../enroll/enroll.service';

/** Aggregated progress returned by GET .../progress (single source: LessonProgress + Enrollment). */
export type MyCourseProgressPayload = {
  success: true;
  courseId: string;
  studentId: string;
  completedLessonIds: string[];
  completedLessonsCount: number;
  totalLessons: number;
  progressPercentage: number;
  completed: boolean;
  lastLessonId: string | null;
  lastAccessedAt: string | null;
};

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(Lesson.name)
    private lessonModel: Model<LessonDocument>,
    private enrollmentService: EnrollService,
  ) {}

  private async findLessonInCourse(
    courseId: string,
    lessonId: string,
  ): Promise<LessonDocument | null> {
    if (!Types.ObjectId.isValid(lessonId)) return null;
    return this.lessonModel.findOne({ _id: lessonId, courseId });
  }

  async markLessonComplete(
    courseId: string,
    lessonId: string,
    userId: string,
    createdBy: string,
    completed = true,
    timeSpentSec?: number,
  ) {
    const enrolled = await this.enrollmentService.isEnrolled(courseId, userId);
    if (!enrolled) {
      throw new ForbiddenException(
        'Enroll in this course before recording lesson progress.',
      );
    }

    const access = await this.enrollmentService.getLessonAccess(
      courseId,
      lessonId,
      userId,
    );
    if (!access.access) {
      throw new ForbiddenException('This lesson is not accessible yet.');
    }

    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const doc = await this.lessonProgressModel.findOneAndUpdate(
      { userId, courseId, lessonId },
      {
        $set: {
          completed,
          completedAt: completed ? new Date() : null,
          createdBy,
        },
        $setOnInsert: {
          userId,
          courseId,
          lessonId,
        },
        $inc: {
          timeSpentSec: timeSpentSec || 0,
        },
      },
      { new: true, upsert: true },
    );

    await this.enrollmentService.touchEnrollmentLastLesson(
      courseId,
      userId,
      lessonId,
    );

    await this.enrollmentService.recalculateEnrollmentProgress(courseId, userId);

    return doc;
  }

  async getMyCourseProgress(
    courseId: string,
    userId: string,
  ): Promise<MyCourseProgressPayload> {
    const totalLessons = await this.lessonModel.countDocuments({ courseId });

    const enrolled = await this.enrollmentService.isEnrolled(courseId, userId);
    if (!enrolled) {
      return {
        success: true,
        courseId,
        studentId: userId,
        completedLessonIds: [],
        completedLessonsCount: 0,
        totalLessons,
        progressPercentage: 0,
        completed: false,
        lastLessonId: null,
        lastAccessedAt: null,
      };
    }

    const [completedRows, resume] = await Promise.all([
      this.lessonProgressModel
        .find({ courseId, userId, completed: true })
        .select('lessonId')
        .lean(),
      this.enrollmentService.getEnrollmentResumeMeta(courseId, userId),
    ]);

    const completedLessonIds = completedRows.map((r) => String(r.lessonId));
    const completedLessonsCount = completedLessonIds.length;
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessonsCount / totalLessons) * 100)
        : 0;
    const completed =
      totalLessons > 0 && completedLessonsCount >= totalLessons;

    return {
      success: true,
      courseId,
      studentId: userId,
      completedLessonIds,
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      completed,
      lastLessonId: resume?.lastLessonId ?? null,
      lastAccessedAt: resume?.lastAccessedAt
        ? new Date(resume.lastAccessedAt).toISOString()
        : null,
    };
  }
}
