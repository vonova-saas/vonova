import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LessonProgress,
  LessonProgressDocument,
} from './schema/lesson-progress.schema';
import { Lesson, LessonDocument } from '../lesson/schema/lesson.schema';
import { EnrollService } from '../enroll/enroll.service';
import {
  appendWatchSegment,
  computeWatchedPercentage,
} from './utils/lesson-watch.util';
import { LessonProgressionEngine } from './lesson-progression.engine';
import { matchCourseIdFilter } from '../enroll/utils/lesson-sequence.util';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import {
  SheetProgress,
  SheetProgressDocument,
} from '../../lms-ai/problem-solving/schemas/sheet-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';

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
    @InjectModel(ProblemSheet.name, LMS_AI_CONNECTION_NAME)
    private problemSheetModel: Model<ProblemSheetDocument>,
    @InjectModel(SheetProgress.name, LMS_AI_CONNECTION_NAME)
    private sheetProgressModel: Model<SheetProgressDocument>,
    private enrollmentService: EnrollService,
    private readonly progressionEngine: LessonProgressionEngine,
  ) {}

  private matchProgressQuery(courseId: string, userId: string, lessonId?: string): any {
    const cs = String(courseId ?? '').trim();
    const uid = String(userId ?? '').trim();
    const courseOid = Types.ObjectId.isValid(cs) ? new Types.ObjectId(cs) : null;
    const userOid = Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null;

    const query: any = {
      $or: [
        { courseId: cs },
        ...(courseOid ? [{ courseId: courseOid }] : []),
      ],
      $and: [
        {
          $or: [
            { userId: uid },
            ...(userOid ? [{ userId: userOid }] : []),
          ],
        },
      ],
    };

    if (lessonId) {
      const ls = String(lessonId).trim();
      const lessonOid = Types.ObjectId.isValid(ls) ? new Types.ObjectId(ls) : null;
      query.$and.push({
        $or: [
          { lessonId: ls },
          ...(lessonOid ? [{ lessonId: lessonOid }] : []),
        ],
      });
    }

    return query;
  }

  private async findLessonInCourse(
    courseId: string,
    lessonId: string,
  ): Promise<LessonDocument | null> {
    if (!Types.ObjectId.isValid(lessonId)) return null;
    const cs = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(cs)) return null;
    const courseOid = new Types.ObjectId(cs);
    return this.lessonModel.findOne({
      _id: lessonId,
      ...matchCourseIdFilter(courseOid, cs),
    });
  }

  private async getLessonSheetRequirements(
    lessonId: string,
    userId: string,
  ): Promise<{ requiredSheetIds: string[]; completedSheetIds: string[] }> {
    if (!Types.ObjectId.isValid(lessonId)) {
      return { requiredSheetIds: [], completedSheetIds: [] };
    }

    const sheets = await this.problemSheetModel
      .find({ lessonId: new Types.ObjectId(lessonId), status: 'published' })
      .select('_id')
      .lean();
    const requiredSheetIds = sheets.map((sheet) => String(sheet._id));
    if (requiredSheetIds.length === 0) {
      return { requiredSheetIds, completedSheetIds: [] };
    }

    const completed = await this.sheetProgressModel
      .find({
        studentId: userId,
        sheetId: { $in: requiredSheetIds },
        completed: true,
      })
      .select('sheetId')
      .lean();

    return {
      requiredSheetIds,
      completedSheetIds: completed.map((row) => String(row.sheetId)),
    };
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

    const hasVideo = !!lesson.videoObjectKey?.trim();
    if (completed) {
      const existing = await this.lessonProgressModel
        .findOne(this.matchProgressQuery(courseId, userId, lessonId))
        .select('watchedPercentage')
        .lean();
      const pct = existing?.watchedPercentage ?? 0;
      const sheetRequirements = await this.getLessonSheetRequirements(
        lessonId,
        userId,
      );
      const progression = this.progressionEngine.evaluateLessonCompletion({
        watchedPercentage: pct,
        hasVideo,
        ...sheetRequirements,
      });
      if (!progression.canMarkComplete) {
        throw new ForbiddenException(
          'Complete the required lesson activities before marking this lesson complete.',
        );
      }
    }

    const doc = await this.lessonProgressModel.findOneAndUpdate(
      this.matchProgressQuery(courseId, userId, lessonId),
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

    await this.enrollmentService.recalculateEnrollmentProgress(
      courseId,
      userId,
    );

    return doc;
  }

  async updateLessonWatchProgress(
    courseId: string,
    lessonId: string,
    userId: string,
    createdBy: string,
    currentTime: number,
    duration: number,
  ) {
    const enrolled = await this.enrollmentService.isEnrolled(courseId, userId);
    if (!enrolled) {
      throw new ForbiddenException(
        'Enroll in this course before recording watch progress.',
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

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new BadRequestException('Video duration is required');
    }

    const existing = await this.lessonProgressModel
      .findOne(this.matchProgressQuery(courseId, userId, lessonId))
      .lean();

    const segments = appendWatchSegment(
      (existing?.watchedSegments as { start: number; end: number }[]) ?? [],
      currentTime,
      duration,
    );
    const watchedPercentage = computeWatchedPercentage(segments, duration);

    const doc = await this.lessonProgressModel.findOneAndUpdate(
      this.matchProgressQuery(courseId, userId, lessonId),
      {
        $set: {
          watchedSegments: segments,
          watchedPercentage,
          videoDurationSec: duration,
          createdBy,
        },
        $setOnInsert: {
          userId,
          courseId,
          lessonId,
          completed: false,
        },
      },
      { new: true, upsert: true },
    );

    await this.enrollmentService.touchEnrollmentLastLesson(
      courseId,
      userId,
      lessonId,
    );

    let progression = this.progressionEngine.evaluateLessonCompletion({
      watchedPercentage: doc.watchedPercentage ?? 0,
      completed: doc.completed,
      hasVideo: !!lesson.videoObjectKey?.trim(),
      ...(await this.getLessonSheetRequirements(lessonId, userId)),
    });

    if (progression.canMarkComplete && !doc.completed) {
      doc.completed = true;
      doc.completedAt = new Date();
      await doc.save();

      await this.enrollmentService.recalculateEnrollmentProgress(
        courseId,
        userId,
      );

      progression = this.progressionEngine.evaluateLessonCompletion({
        watchedPercentage: doc.watchedPercentage ?? 0,
        completed: true,
        hasVideo: !!lesson.videoObjectKey?.trim(),
        ...(await this.getLessonSheetRequirements(lessonId, userId)),
      });
    }

    return {
      ...progression,
      threshold: progression.watchThreshold,
    };
  }

  async getLessonWatchProgress(
    courseId: string,
    lessonId: string,
    userId: string,
  ) {
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const row = await this.lessonProgressModel
      .findOne(this.matchProgressQuery(courseId, userId, lessonId))
      .select('watchedPercentage completed')
      .lean();

    const pct = row?.watchedPercentage ?? 0;
    const hasVideo = !!lesson.videoObjectKey?.trim();

    const progression = this.progressionEngine.evaluateLessonCompletion({
      watchedPercentage: pct,
      completed: !!row?.completed,
      hasVideo,
      ...(await this.getLessonSheetRequirements(lessonId, userId)),
    });

    return {
      ...progression,
      threshold: progression.watchThreshold,
    };
  }

  async getMyCourseProgress(
    courseId: string,
    userId: string,
  ): Promise<MyCourseProgressPayload> {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) {
      throw new NotFoundException('Course not found');
    }
    const courseOid = new Types.ObjectId(courseIdStr);
    const totalLessons = await this.lessonModel.countDocuments(
      matchCourseIdFilter(courseOid, courseIdStr),
    );

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

    const uid = String(userId ?? '').trim();
    const userOid = Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null;
    const [completedRows, resume] = await Promise.all([
      this.lessonProgressModel
        .find({
          $or: [
            { courseId: courseIdStr },
            { courseId: courseOid },
          ],
          $and: [
            {
              $or: [
                { userId: uid },
                ...(userOid ? [{ userId: userOid }] : []),
              ],
            },
            { completed: true },
          ],
        })
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
    const completed = totalLessons > 0 && completedLessonsCount >= totalLessons;

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
