import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Course } from '../course/schema/course.schema';
import { Enrollment, EnrollmentDocument } from './schema/enrollment.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import {
  LessonProgress,
  LessonProgressDocument,
} from '../progress/schema/lesson-progress.schema';
import { QuizAnswer } from '../../quiz/schema/quiz-answer.schema';
import { Quiz } from '../../quiz/schema/quiz.schema';
import { Types } from 'mongoose';
import {
  flattenLessonOrder,
  isChapterUnlocked,
  isLessonUnlockedInSequence,
  matchCourseIdFilter,
} from './utils/lesson-sequence.util';
import { Chapter } from '../chapter/schema/chapter.schema';

@Injectable()
export class EnrollService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(QuizAnswer.name) private quizAnswerModel: Model<QuizAnswer>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  private readonly eventLogger = new Logger('EnrollEvents');

  /**
   * Public course → anyone. Private course → owner or active enrollment.
   * Unauthenticated users only get access to public courses.
   */
  async canAccessCourseContent(
    userId: string | undefined,
    courseId: string,
  ): Promise<boolean> {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) return false;

    const visibility = (course as { visibility?: string }).visibility ?? 'PUBLIC';
    const uid = userId != null ? String(userId).trim() : '';
    if (visibility === 'PUBLIC') return true;

    if (!uid) return false;

    const rawOwner = (course as { ownerId?: Types.ObjectId | string }).ownerId;
    const ownerStr =
      rawOwner != null
        ? rawOwner instanceof Types.ObjectId
          ? rawOwner.toHexString()
          : String(rawOwner).trim()
        : '';
    if (ownerStr && uid === ownerStr) return true;
    try {
      if (
        Types.ObjectId.isValid(uid) &&
        rawOwner != null &&
        new Types.ObjectId(uid).equals(
          rawOwner instanceof Types.ObjectId
            ? rawOwner
            : new Types.ObjectId(String(rawOwner)),
        )
      ) {
        return true;
      }
    } catch {
      /* fall through to enrollment */
    }

    return this.isEnrolled(courseId, uid);
  }

  async enrollCourse(
    courseId: string,
    userId: string,
    createdBy: string,
    couponCode?: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.enrollmentModel.findOne({ courseId, userId });
    if (existing) return existing;

    const enrollment = await this.enrollmentModel.create({
      courseId,
      userId,
      createdBy,
      status: 'ACTIVE',
      progressPercentage: 0,
      purchasedAt: new Date(),
      pricePaid: course.price?.amount,
      currency: course.price?.currency,
      couponCode,
    });

    try {
      this.natsClient.emit('app.events.enroll.completed', {
        courseId: String(courseId),
        userId: String(userId),
      });
      this.eventLogger.log(
        `Emitted app.events.enroll.completed courseId=${String(courseId)} userId=${String(userId)}`,
      );
    } catch (err) {
      this.eventLogger.warn(
        `Failed to emit enroll.completed event: ${(err as Error).message}`,
      );
    }

    return enrollment;
  }

  /**
   * Cancel/refund/remove an enrollment and emit `enroll.cancelled` so the
   * community service can auto-remove the student from the course group.
   */
  async cancelEnrollment(courseId: string, userId: string) {
    const enrollment = await this.enrollmentModel.findOneAndUpdate(
      { courseId, userId, status: { $in: ['ACTIVE', 'COMPLETED'] } },
      { $set: { status: 'CANCELED' } },
      { new: true },
    );

    try {
      this.natsClient.emit('app.events.enroll.cancelled', {
        courseId: String(courseId),
        userId: String(userId),
      });
    } catch (err) {
      this.eventLogger.warn(
        `Failed to emit enroll.cancelled event: ${(err as Error).message}`,
      );
    }

    return enrollment;
  }

  async getEnrollment(courseId: string, userId: string) {
    const enrollment = await this.enrollmentModel.findOne({ courseId, userId });
    if (!enrollment) throw new NotFoundException('Not enrolled');
    return enrollment;
  }

  /**
   * Paginated enrolled student ids for notification fan-out.
   * Cursor is the last seen enrollment _id (hex string).
   */
  async listEnrolledStudentIdsByCourse(
    courseId: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<{ userIds: string[]; nextCursor: string | null; total: number }> {
    const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500);
    const filter: Record<string, unknown> = {
      courseId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    };
    if (opts?.cursor && Types.ObjectId.isValid(opts.cursor)) {
      filter._id = { $gt: new Types.ObjectId(opts.cursor) };
    }
    const [rows, total] = await Promise.all([
      this.enrollmentModel
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .select('userId _id')
        .lean(),
      this.enrollmentModel.countDocuments({
        courseId,
        status: { $in: ['ACTIVE', 'COMPLETED'] },
      }),
    ]);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const userIds = [
      ...new Set(page.map((r) => String(r.userId)).filter(Boolean)),
    ];
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last?._id ? String(last._id) : null;
    return { userIds, nextCursor, total };
  }

  private matchEnrollmentQuery(courseId: string, userId: string): any {
    const cs = String(courseId ?? '').trim();
    const uid = String(userId ?? '').trim();
    const courseOid = Types.ObjectId.isValid(cs) ? new Types.ObjectId(cs) : null;
    const userOid = Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null;

    return {
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
  }

  private matchUserQuery(userId: string): any {
    const uid = String(userId ?? '').trim();
    const userOid = Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null;
    return {
      $or: [
        { userId: uid },
        ...(userOid ? [{ userId: userOid }] : []),
      ],
    };
  }

  async isEnrolled(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await this.enrollmentModel.findOne({
      ...this.matchEnrollmentQuery(courseId, userId),
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });
    return !!enrollment;
  }

  async listActiveEnrollmentsForUser(userId: string) {
    return this.enrollmentModel
      .find({
        ...this.matchUserQuery(userId),
        status: { $in: ['ACTIVE', 'COMPLETED'] },
      })
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Same as `listActiveEnrollmentsForUser` but drops rows whose course no
   * longer exists. Doing this in one DB roundtrip avoids the per-row
   * `getCourseById` lookups that otherwise spam `Course not found` errors
   * through the gateway's exception filter.
   */
  async listActiveEnrollmentsForUserWithLiveCourse(userId: string) {
    const rows = await this.enrollmentModel
      .find({
        ...this.matchUserQuery(userId),
        status: { $in: ['ACTIVE', 'COMPLETED'] },
      })
      .sort({ updatedAt: -1 })
      .lean();
    if (rows.length === 0) return rows;

    const courseIds = [
      ...new Set(
        rows
          .map((r) => r.courseId)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ];
    const liveIds = await this.courseModel
      .find({ _id: { $in: courseIds } })
      .select('_id')
      .lean();
    const live = new Set(liveIds.map((c) => String(c._id)));
    return rows.filter((r) => live.has(String(r.courseId)));
  }

  private async getCompletedLessonIdSet(
    courseId: string,
    userId: string,
  ): Promise<Set<string>> {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) return new Set();
    const courseOid = new Types.ObjectId(courseIdStr);
    const userIdStr = String(userId ?? '').trim();
    const userOid = Types.ObjectId.isValid(userIdStr) ? new Types.ObjectId(userIdStr) : null;

    const rows = await this.lessonProgressModel
      .find({
        ...matchCourseIdFilter(courseOid, courseIdStr),
        $or: [
          { userId: userIdStr },
          ...(userOid ? [{ userId: userOid }] : []),
        ],
        completed: true,
      })
      .select('lessonId')
      .lean();
    return new Set(rows.map((r) => String(r.lessonId)));
  }

  private async buildCourseLessonTree(courseId: string) {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) return [];
    const courseOid = new Types.ObjectId(courseIdStr);
    const filter = matchCourseIdFilter(courseOid, courseIdStr);
    const [chapters, lessons] = await Promise.all([
      this.chapterModel.find(filter).sort({ index: 1 }).lean(),
      this.lessonModel.find(filter).sort({ chapterId: 1, index: 1 }).lean(),
    ]);

    const lessonsByChapter = new Map<string, typeof lessons>();
    for (const l of lessons) {
      const key = String(l.chapterId);
      const arr = lessonsByChapter.get(key) ?? [];
      arr.push(l);
      lessonsByChapter.set(key, arr);
    }

    if (chapters.length === 0) {
      return [
        {
          id: '__course_content__',
          index: 0,
          lessons: lessons.map((l) => ({
            id: String(l._id),
            previewable: !!l.previewable,
            index: l.index,
          })),
        },
      ];
    }

    return chapters.map((c) => ({
      id: String(c._id),
      index: c.index,
      lessons: (lessonsByChapter.get(String(c._id)) ?? []).map((l) => ({
        id: String(l._id),
        previewable: !!l.previewable,
        index: l.index,
      })),
    }));
  }

  async getLessonAccess(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      ...matchCourseIdFilter(new Types.ObjectId(courseId), courseId),
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = await this.courseModel.findById(courseId).select('ownerId').lean();
    const ownerId = (course as { ownerId?: unknown } | null)?.ownerId;
    const isOwner =
      ownerId != null &&
      String(ownerId) === String(userId);

    const canContent = await this.canAccessCourseContent(userId, courseId);
    const preview = !!lesson.previewable;

    if (!preview && !canContent && !isOwner) {
      return {
        access: false,
        reason: 'forbidden',
        previewable: preview,
        locked: true,
      };
    }

    if (isOwner || preview) {
      return {
        access: true,
        reason: preview && !canContent && !isOwner ? 'preview' : 'allowed',
        previewable: preview,
        locked: false,
      };
    }

    const tree = await this.buildCourseLessonTree(courseId);
    const flatOrder = flattenLessonOrder(tree);
    const completed = await this.getCompletedLessonIdSet(courseId, userId);
    const chapterIndex = tree.findIndex((ch) =>
      ch.lessons.some((l) => String(l.id) === String(lessonId)),
    );
    const chapterLocked =
      chapterIndex > 0 && !isChapterUnlocked(chapterIndex, tree, completed);
    const lessonLocked =
      chapterLocked ||
      !isLessonUnlockedInSequence(
        String(lessonId),
        flatOrder,
        completed,
        preview,
      );

    if (lessonLocked) {
      return {
        access: false,
        reason: 'locked',
        previewable: preview,
        locked: true,
      };
    }

    return {
      access: true,
      reason: 'allowed',
      previewable: preview,
      locked: false,
    };
  }

  async recalculateEnrollmentProgress(courseId: string, userId: string) {
    const cs = String(courseId ?? '').trim();
    const uid = String(userId ?? '').trim();
    if (!cs || !uid) return;
    const courseOid = Types.ObjectId.isValid(cs) ? new Types.ObjectId(cs) : null;
    const userOid = Types.ObjectId.isValid(uid) ? new Types.ObjectId(uid) : null;

    const enrollment = await this.enrollmentModel.findOne(
      this.matchEnrollmentQuery(cs, uid)
    );
    if (!enrollment) return;

    const [total, completed] = await Promise.all([
      this.lessonModel.countDocuments(
        matchCourseIdFilter(new Types.ObjectId(courseId), courseId),
      ),
      this.lessonProgressModel.countDocuments({
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
          { completed: true },
        ],
      }),
    ]);

    const progressPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const update: Record<string, unknown> = {
      progressPercentage,
    };

    if (progressPercentage >= 100 && total > 0) {
      update.status = 'COMPLETED';
      update.completedAt = new Date();
    }

    await this.enrollmentModel.findOneAndUpdate(
      this.matchEnrollmentQuery(cs, uid),
      { $set: update },
    );
  }

  /**
   * Updates resume pointers on the enrollment row (Continue learning).
   * No-op if not enrolled.
   */
  async touchEnrollmentLastLesson(
    courseId: string,
    userId: string,
    lessonId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(lessonId)) return;
    const cs = String(courseId ?? '').trim();
    const uid = String(userId ?? '').trim();

    await this.enrollmentModel.findOneAndUpdate(
      this.matchEnrollmentQuery(cs, uid),
      {
        $set: {
          lastLessonId: new Types.ObjectId(lessonId),
          lastAccessedAt: new Date(),
        },
      },
    );
  }

  async getEnrollmentResumeMeta(
    courseId: string,
    userId: string,
  ): Promise<{
    lastLessonId: string | null;
    lastAccessedAt: Date | null;
    enrollmentProgress: number;
  } | null> {
    const cs = String(courseId ?? '').trim();
    const uid = String(userId ?? '').trim();

    const e = await this.enrollmentModel
      .findOne(this.matchEnrollmentQuery(cs, uid))
      .select('lastLessonId lastAccessedAt progressPercentage')
      .lean();
    if (!e) return null;
    return {
      lastLessonId: e.lastLessonId ? String(e.lastLessonId) : null,
      lastAccessedAt: (e.lastAccessedAt as Date) ?? null,
      enrollmentProgress: e.progressPercentage ?? 0,
    };
  }

  async getInstructorCourseAnalytics(courseId: string, instructorId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('Course not found');
    if (String((course as { ownerId?: Types.ObjectId }).ownerId) !== instructorId) {
      throw new ForbiddenException('Not owner of this course');
    }

    const enrollments = await this.enrollmentModel
      .find({ courseId, status: { $in: ['ACTIVE', 'COMPLETED'] } })
      .lean();

    const courseOid = new Types.ObjectId(courseId);
    const quizDocs = await this.lessonModel
      .find({
        ...matchCourseIdFilter(courseOid, courseId),
        quizId: { $exists: true, $ne: null },
      })
      .select('quizId')
      .lean();
    const quizIds = [
      ...new Set(
        quizDocs
          .map((l) => l.quizId)
          .filter(Boolean)
          .map((id) => new Types.ObjectId(String(id))),
      ),
    ];

    const quizTitleMap = new Map<string, string>();
    if (quizIds.length > 0) {
      const qs = await this.quizModel
        .find({ _id: { $in: quizIds } })
        .select('title')
        .lean();
      for (const q of qs) {
        quizTitleMap.set(String(q._id), q.title || 'Quiz');
      }
    }

    const students = await Promise.all(
      enrollments.map(async (e) => {
        const sid = String(e.userId);
        let quizAverage = 0;
        let quizAttempts = 0;
        if (quizIds.length > 0) {
          const attempts = await this.quizAnswerModel
            .find({ userId: e.userId, quiz: { $in: quizIds } })
            .lean();
          quizAttempts = attempts.length;
          if (attempts.length > 0) {
            quizAverage =
              Math.round(
                (attempts.reduce((s, a) => s + (a.percentage || 0), 0) /
                  attempts.length) *
                  100,
              ) / 100;
          }
        }

        const lessonsCompleted = await this.lessonProgressModel.countDocuments({
          courseId,
          userId: e.userId,
          completed: true,
        });
        const totalLessons = await this.lessonModel.countDocuments(
          matchCourseIdFilter(new Types.ObjectId(courseId), courseId),
        );

        return {
          studentId: sid,
          name: null as string | null,
          email: null as string | null,
          progress: e.progressPercentage ?? 0,
          quizAverage,
          quizAttempts,
          problemsSolved: 0,
          lessonsCompleted,
          totalLessons,
          enrollmentStatus: e.status,
        };
      }),
    );

    const attempts = await this.quizAnswerModel
      .find({ quiz: { $in: quizIds } })
      .sort({ createdAt: -1 })
      .limit(400)
      .lean();

    const quizAnalytics = attempts.map((a) => ({
      studentId: String(a.userId),
      studentName: null as string | null,
      quizId: String(a.quiz),
      quizTitle: quizTitleMap.get(String(a.quiz)) ?? 'Quiz',
      attempts: 1,
      score: a.percentage,
      submittedAt: a.submittedAt ?? (a as { createdAt?: Date }).createdAt,
    }));

    const completionRate =
      enrollments.length > 0
        ? Math.round(
            (enrollments.filter((e) => e.status === 'COMPLETED').length /
              enrollments.length) *
              10000,
          ) / 100
        : 0;

    const activeStudents = enrollments.filter((e) => e.status === 'ACTIVE')
      .length;

    let sumQuiz = 0;
    let nQuiz = 0;
    for (const s of students) {
      if (s.quizAverage > 0) {
        sumQuiz += s.quizAverage;
        nQuiz++;
      }
    }
    const averageQuizScore =
      nQuiz > 0 ? Math.round((sumQuiz / nQuiz) * 100) / 100 : 0;

    const allPercents = attempts.map((a) => a.percentage || 0);
    const highestScore = allPercents.length ? Math.max(...allPercents) : 0;
    const lowestScore = allPercents.length ? Math.min(...allPercents) : 0;
    const attemptsCount = attempts.length;
    const passRate =
      allPercents.length > 0
        ? Math.round(
            (allPercents.filter((p) => p >= 60).length / allPercents.length) *
              10000,
          ) / 100
        : 0;

    const avgProgress =
      enrollments.length > 0
        ? Math.round(
            (enrollments.reduce(
              (s, e) => s + (e.progressPercentage ?? 0),
              0,
            ) /
              enrollments.length) *
              100,
          ) / 100
        : 0;

    const inactiveStudents = enrollments.filter(
      (e) => e.status !== 'ACTIVE' && e.status !== 'COMPLETED',
    ).length;

    return {
      students,
      quizzes: {
        averageScore: averageQuizScore,
        highestScore,
        lowestScore,
        attemptsCount,
        passRate,
        rows: quizAnalytics,
      },
      problems: {
        solvedCount: 0,
        failedCount: 0,
        hintsUsed: 0,
        solutionUsage: 0,
        averageAttempts: 0,
        rows: [] as Array<Record<string, unknown>>,
      },
      materials: {
        views: 0,
        downloads: 0,
        completionRate: 0,
      },
      progress: {
        completionRate,
        averageProgress: avgProgress,
        totalEnrolled: enrollments.length,
        activeStudents,
        inactiveStudents,
      },
      quizAnalytics,
      problemAnalytics: [] as Array<Record<string, unknown>>,
      completionRate,
      averageQuizScore,
      averageProblemScore: 0,
      activeStudents,
    };
  }

  /**
   * Problems not attached to any lesson are treated as global practice (open).
   * If attached to lessons, the user may open them when they can access at least
   * one linked course (e.g. public course or enrolled private course).
   */
  async canAccessProblem(
    userId: string | undefined,
    problemId: string,
  ): Promise<boolean> {
    const lessons = await this.lessonModel
      .find({ problems: new Types.ObjectId(problemId) })
      .select('courseId')
      .lean();
    if (!lessons.length) return true;

    const courseIds = [
      ...new Set(lessons.map((l) => String(l.courseId))),
    ];
    for (const cid of courseIds) {
      if (await this.canAccessCourseContent(userId, cid)) return true;
    }
    return false;
  }

  async assertProblemAccess(
    userId: string | undefined,
    problemId: string,
  ): Promise<void> {
    const ok = await this.canAccessProblem(userId, problemId);
    if (!ok) {
      throw new ForbiddenException(
        'You must enroll in this course first',
      );
    }
  }
}
