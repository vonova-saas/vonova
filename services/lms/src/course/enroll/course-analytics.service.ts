import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from '../course/schema/course.schema';
import { Enrollment, EnrollmentDocument } from './schema/enrollment.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import {
  LessonProgress,
  LessonProgressDocument,
} from '../progress/schema/lesson-progress.schema';
import { QuizAnswer } from '../../quiz/schema/quiz-answer.schema';
import { Quiz } from '../../quiz/schema/quiz.schema';
import { ProblemSheet } from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import { Problem } from '../../lms-ai/problem-solving/schemas/problem.schema';
import { ProblemSolvingProgress } from '../../lms-ai/problem-solving/schemas/problem-solving-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';
import { matchCourseIdFilter } from './utils/lesson-sequence.util';
import type {
  CourseAnalyticsOverview,
  CourseEngagementAnalytics,
  CourseQuizAnalyticsSummary,
  CourseStudentAnalyticsRow,
} from './course-analytics.types';

const CACHE_TTL_MS = 60_000;

@Injectable()
export class CourseAnalyticsService {
  private readonly log = new Logger('CourseAnalytics');
  private readonly cache = new Map<
    string,
    { expires: number; data: unknown }
  >();

  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<Lesson>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(QuizAnswer.name) private readonly quizAnswerModel: Model<QuizAnswer>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectModel(ProblemSheet.name, LMS_AI_CONNECTION_NAME)
    private readonly sheetModel: Model<ProblemSheet>,
    @InjectModel(Problem.name, LMS_AI_CONNECTION_NAME)
    private readonly problemModel: Model<Problem>,
    @InjectModel(ProblemSolvingProgress.name, LMS_AI_CONNECTION_NAME)
    private readonly problemProgressModel: Model<ProblemSolvingProgress>,
  ) {}

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  private async getCourseForInstructor(courseId: string, instructorId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('Course not found');
    if (String((course as { ownerId?: Types.ObjectId }).ownerId) !== instructorId) {
      throw new ForbiddenException('Not owner of this course');
    }
    return course as {
      _id: Types.ObjectId;
      title?: string;
      ownerId?: Types.ObjectId;
      communityGroupId?: Types.ObjectId | null;
    };
  }

  private getCached<T>(key: string): T | null {
    const hit = this.cache.get(key);
    if (!hit || hit.expires < Date.now()) return null;
    return hit.data as T;
  }

  private setCached(key: string, data: unknown) {
    this.cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  }

  private async courseContext(courseId: string, instructorId: string) {
    const course = await this.getCourseForInstructor(courseId, instructorId);
    const courseOid = this.oid(courseId);
    const enrollments = await this.enrollmentModel
      .find({ courseId, status: { $in: ['ACTIVE', 'COMPLETED'] } })
      .lean();
    const totalLessons = await this.lessonModel.countDocuments(
      matchCourseIdFilter(courseOid, courseId),
    );
    const quizLessonDocs = await this.lessonModel
      .find({
        ...matchCourseIdFilter(courseOid, courseId),
        quizId: { $exists: true, $ne: null },
      })
      .select('quizId')
      .lean();
    const quizIds = [
      ...new Set(
        quizLessonDocs
          .map((l) => l.quizId)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ];
    const quizOids = quizIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => this.oid(id));
    return { course, courseOid, enrollments, totalLessons, quizIds, quizOids };
  }

  private async problemIdsForCourse(courseOid: Types.ObjectId): Promise<string[]> {
    const sheets = await this.sheetModel
      .find({ courseId: courseOid, status: 'published' })
      .select('_id')
      .lean();
    const sheetIds = sheets.map((sheet) => sheet._id).filter(Boolean);
    if (sheetIds.length === 0) return [];

    const problems = await this.problemModel
      .find({
        sheetId: { $in: sheetIds },
        isSheetScoped: true,
        visibilityScope: 'SHEET_ONLY',
      })
      .select('_id')
      .lean();

    return problems.map((problem) => String(problem._id));
  }

  private async solvedCountByUser(
    problemIds: string[],
    userOids: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!problemIds.length || !userOids.length) return map;
    const rows = await this.problemProgressModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          problemId: { $in: problemIds },
          solved: true,
          userId: { $in: userOids.map((id) => String(id)) },
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    for (const r of rows) map.set(String(r._id), r.count);
    return map;
  }

  private async lessonCompletedByUser(
    courseId: string,
    userOids: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!userOids.length) return map;
    const rows = await this.lessonProgressModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          courseId,
          userId: { $in: userOids },
          completed: true,
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    for (const r of rows) map.set(String(r._id), r.count);
    return map;
  }

  private async quizStatsByUser(
    quizOids: Types.ObjectId[],
    userOids: Types.ObjectId[],
  ): Promise<Map<string, { avg: number; attempts: number }>> {
    const map = new Map<string, { avg: number; attempts: number }>();
    if (!quizOids.length || !userOids.length) return map;
    const rows = await this.quizAnswerModel.aggregate<{
      _id: Types.ObjectId;
      avg: number;
      attempts: number;
    }>([
      { $match: { quiz: { $in: quizOids }, userId: { $in: userOids } } },
      {
        $group: {
          _id: '$userId',
          avg: { $avg: '$percentage' },
          attempts: { $sum: 1 },
        },
      },
    ]);
    for (const r of rows) {
      map.set(String(r._id), {
        avg: Math.round((r.avg ?? 0) * 100) / 100,
        attempts: r.attempts,
      });
    }
    return map;
  }

  async getOverview(
    courseId: string,
    instructorId: string,
  ): Promise<CourseAnalyticsOverview> {
    const cacheKey = `overview:${courseId}`;
    const cached = this.getCached<CourseAnalyticsOverview>(cacheKey);
    if (cached) return cached;

    const started = Date.now();
    const ctx = await this.courseContext(courseId, instructorId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const userOids = ctx.enrollments.map((e) => e.userId as Types.ObjectId);
    const problemIds = await this.problemIdsForCourse(ctx.courseOid);
    const [lessonByUser, quizByUser, solvedByUser] = await Promise.all([
      this.lessonCompletedByUser(courseId, userOids),
      this.quizStatsByUser(ctx.quizOids, userOids),
      this.solvedCountByUser(problemIds, userOids),
    ]);

    let totalLessonsCompleted = 0;
    let sumProgress = 0;
    let sumQuiz = 0;
    let nQuiz = 0;
    let totalProblemsSolved = 0;
    for (const e of ctx.enrollments) {
      const sid = String(e.userId);
      const lc = lessonByUser.get(sid) ?? 0;
      totalLessonsCompleted += lc;
      sumProgress += e.progressPercentage ?? 0;
      const q = quizByUser.get(sid);
      if (q && q.avg > 0) {
        sumQuiz += q.avg;
        nQuiz += 1;
      }
      totalProblemsSolved += solvedByUser.get(sid) ?? 0;
    }

    const activeStudents7d = ctx.enrollments.filter((e) => {
      const la = e.lastAccessedAt ? new Date(e.lastAccessedAt) : null;
      return la && la >= sevenDaysAgo;
    }).length;

    const activePrev7d = ctx.enrollments.filter((e) => {
      const la = e.lastAccessedAt ? new Date(e.lastAccessedAt) : null;
      return la && la >= fourteenDaysAgo && la < sevenDaysAgo;
    }).length;

    const enrolled7d = ctx.enrollments.filter((e) => {
      const ca = (e as { createdAt?: Date }).createdAt;
      return ca && new Date(ca) >= sevenDaysAgo;
    }).length;
    const enrolledPrev7d = ctx.enrollments.filter((e) => {
      const ca = (e as { createdAt?: Date }).createdAt;
      return ca && new Date(ca) >= fourteenDaysAgo && new Date(ca) < sevenDaysAgo;
    }).length;

    const growthActive7dPct =
      activePrev7d > 0
        ? Math.round(((activeStudents7d - activePrev7d) / activePrev7d) * 100)
        : activeStudents7d > 0
          ? 100
          : 0;
    const growthEnrollments7dPct =
      enrolledPrev7d > 0
        ? Math.round(((enrolled7d - enrolledPrev7d) / enrolledPrev7d) * 100)
        : enrolled7d > 0
          ? 100
          : 0;

    const attempts = await this.quizAnswerModel
      .find({ quiz: { $in: ctx.quizOids } })
      .sort({ submittedAt: -1 })
      .limit(15)
      .lean();

    const recentCompletions = await this.lessonProgressModel
      .find({ courseId, completed: true })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    const recentActivity: CourseAnalyticsOverview['recentActivity'] = [];
    for (const a of attempts) {
      recentActivity.push({
        type: 'QUIZ',
        label: 'Quiz submitted',
        at: (a.submittedAt ?? (a as { createdAt?: Date }).createdAt ?? now).toISOString(),
        userId: String(a.userId),
      });
    }
    for (const lp of recentCompletions) {
      recentActivity.push({
        type: 'LESSON',
        label: 'Lesson completed',
        at: (
          lp.completedAt ??
          (lp as { updatedAt?: Date }).updatedAt ??
          now
        ).toISOString(),
        userId: String(lp.userId),
      });
    }
    recentActivity.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );

    const allPercents =
      ctx.quizOids.length > 0
        ? (
            await this.quizAnswerModel
              .find({ quiz: { $in: ctx.quizOids } })
              .select('percentage')
              .lean()
          ).map((a) => a.percentage ?? 0)
        : [];

    const overview: CourseAnalyticsOverview = {
      courseId,
      courseTitle: ctx.course.title ?? 'Course',
      communityGroupId: ctx.course.communityGroupId
        ? String(ctx.course.communityGroupId)
        : null,
      totalEnrollments: ctx.enrollments.length,
      activeStudents7d,
      completedStudents: ctx.enrollments.filter((e) => e.status === 'COMPLETED')
        .length,
      averageProgress:
        ctx.enrollments.length > 0
          ? Math.round((sumProgress / ctx.enrollments.length) * 100) / 100
          : 0,
      averageQuizScore: nQuiz > 0 ? Math.round((sumQuiz / nQuiz) * 100) / 100 : 0,
      totalLessons: ctx.totalLessons,
      totalLessonsCompleted,
      lessonCompletionRate:
        ctx.enrollments.length > 0 && ctx.totalLessons > 0
          ? Math.round(
              (totalLessonsCompleted /
                (ctx.enrollments.length * ctx.totalLessons)) *
                10000,
            ) / 100
          : 0,
      totalQuizAttempts: allPercents.length,
      totalProblemsSolved,
      growthEnrollments7dPct,
      growthActive7dPct,
      lastUpdatedAt: now.toISOString(),
      recentActivity: recentActivity.slice(0, 20),
    };

    this.setCached(cacheKey, overview);
    this.log.log(
      `[COURSE_ANALYTICS] overview courseId=${courseId} instructorId=${instructorId} durationMs=${Date.now() - started} enrollments=${overview.totalEnrollments}`,
    );
    return overview;
  }

  async getStudents(
    courseId: string,
    instructorId: string,
    opts: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: 'progress' | 'quiz' | 'lastActive' | 'joined';
      filter?: 'inactive' | 'completed' | 'lowPerformers';
    },
  ) {
    const started = Date.now();
    const ctx = await this.courseContext(courseId, instructorId);
    const userOids = ctx.enrollments.map((e) => e.userId as Types.ObjectId);
    const problemIds = await this.problemIdsForCourse(ctx.courseOid);
    const [lessonByUser, quizByUser, solvedByUser] = await Promise.all([
      this.lessonCompletedByUser(courseId, userOids),
      this.quizStatsByUser(ctx.quizOids, userOids),
      this.solvedCountByUser(problemIds, userOids),
    ]);

    let rows: CourseStudentAnalyticsRow[] = ctx.enrollments.map((e) => {
      const sid = String(e.userId);
      return {
        studentId: sid,
        name: null,
        email: null,
        progress: e.progressPercentage ?? 0,
        lessonsCompleted: lessonByUser.get(sid) ?? 0,
        totalLessons: ctx.totalLessons,
        quizAverage: quizByUser.get(sid)?.avg ?? 0,
        quizAttempts: quizByUser.get(sid)?.attempts ?? 0,
        problemsSolved: solvedByUser.get(sid) ?? 0,
        lastActiveAt: e.lastAccessedAt
          ? new Date(e.lastAccessedAt).toISOString()
          : null,
        joinedAt: (e as { createdAt?: Date }).createdAt
          ? new Date((e as { createdAt?: Date }).createdAt!).toISOString()
          : e.purchasedAt
            ? new Date(e.purchasedAt).toISOString()
            : null,
        enrollmentStatus: e.status,
        communityPosts: 0,
        chatMessages: 0,
      };
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (opts.filter === 'inactive') {
      rows = rows.filter(
        (r) =>
          !r.lastActiveAt || new Date(r.lastActiveAt) < sevenDaysAgo,
      );
    } else if (opts.filter === 'completed') {
      rows = rows.filter((r) => r.enrollmentStatus === 'COMPLETED');
    } else if (opts.filter === 'lowPerformers') {
      rows = rows.filter((r) => r.progress < 40 || r.quizAverage < 50);
    }

    if (opts.search?.trim()) {
      const q = opts.search.trim().toLowerCase();
      rows = rows.filter((r) => r.studentId.toLowerCase().includes(q));
    }

    const sort = opts.sort ?? 'progress';
    rows.sort((a, b) => {
      if (sort === 'quiz') return b.quizAverage - a.quizAverage;
      if (sort === 'lastActive') {
        const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return tb - ta;
      }
      if (sort === 'joined') {
        const ta = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        const tb = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
        return tb - ta;
      }
      return b.progress - a.progress;
    });

    const page = Math.max(opts.page ?? 1, 1);
    const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
    const total = rows.length;
    const skip = (page - 1) * limit;
    const items = rows.slice(skip, skip + limit);

    this.log.log(
      `[COURSE_ANALYTICS] students courseId=${courseId} durationMs=${Date.now() - started} resultCounts=${items.length}`,
    );
    return { items, total, page, limit, hasMore: skip + limit < total };
  }

  async getQuizzes(
    courseId: string,
    instructorId: string,
  ): Promise<CourseQuizAnalyticsSummary> {
    const started = Date.now();
    const ctx = await this.courseContext(courseId, instructorId);
    const titleMap = new Map<string, string>();
    if (ctx.quizOids.length) {
      const qs = await this.quizModel
        .find({ _id: { $in: ctx.quizOids } })
        .select('title questions')
        .lean();
      for (const q of qs) {
        titleMap.set(String(q._id), (q as { title?: string }).title ?? 'Quiz');
      }
    }

    const quizzes: CourseQuizAnalyticsSummary['quizzes'] = [];
    const allPercents: number[] = [];
    const failCounts = new Map<string, { quizId: string; fails: number; total: number }>();

    for (const qid of ctx.quizIds) {
      const attempts = await this.quizAnswerModel
        .find({ quiz: this.oid(qid) })
        .lean();
      const percents = attempts.map((a) => a.percentage ?? 0);
      allPercents.push(...percents);
      const pass =
        percents.length > 0
          ? percents.filter((p) => p >= 60).length / percents.length
          : 0;
      for (const a of attempts) {
        for (const ans of (a as { answers?: Array<{ correct?: boolean | null; questionId?: string }> }).answers ?? []) {
          if (!ans.questionId) continue;
          const key = `${qid}:${ans.questionId}`;
          const cur = failCounts.get(key) ?? {
            quizId: qid,
            fails: 0,
            total: 0,
          };
          cur.total += 1;
          if (ans.correct === false) cur.fails += 1;
          failCounts.set(key, cur);
        }
      }
      quizzes.push({
        quizId: qid,
        title: titleMap.get(qid) ?? 'Quiz',
        attempts: attempts.length,
        averageScore:
          percents.length > 0
            ? Math.round(
                (percents.reduce((s, p) => s + p, 0) / percents.length) * 100,
              ) / 100
            : 0,
        highestScore: percents.length ? Math.max(...percents) : 0,
        lowestScore: percents.length ? Math.min(...percents) : 0,
        passRate: Math.round(pass * 10000) / 100,
        avgCompletionMinutes: null,
      });
    }

    const buckets = [
      { bucket: '0-20', min: 0, max: 20 },
      { bucket: '21-40', min: 21, max: 40 },
      { bucket: '41-60', min: 41, max: 60 },
      { bucket: '61-80', min: 61, max: 80 },
      { bucket: '81-100', min: 81, max: 100 },
    ];
    const scoreHistogram = buckets.map((b) => ({
      bucket: b.bucket,
      count: allPercents.filter((p) => p >= b.min && p <= b.max).length,
    }));

    const topFailedQuestions = [...failCounts.entries()]
      .map(([key, v]) => {
        const questionId = key.split(':')[1] ?? '';
        return {
          quizId: v.quizId,
          quizTitle: titleMap.get(v.quizId) ?? 'Quiz',
          questionId,
          failRate:
            v.total > 0 ? Math.round((v.fails / v.total) * 10000) / 100 : 0,
        };
      })
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 10);

    this.log.log(
      `[QUIZ_ANALYTICS] courseId=${courseId} durationMs=${Date.now() - started} quizzes=${quizzes.length}`,
    );
    return { quizzes, scoreHistogram, topFailedQuestions };
  }

  async getEngagement(
    courseId: string,
    instructorId: string,
  ): Promise<CourseEngagementAnalytics> {
    const started = Date.now();
    await this.getCourseForInstructor(courseId, instructorId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dauRows = await this.lessonProgressModel.aggregate<{
      _id: string;
      users: Types.ObjectId[];
    }>([
      { $match: { courseId, updatedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          users: { $addToSet: '$userId' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyActiveUsers = dauRows.map((r) => ({
      date: r._id,
      count: r.users.length,
    }));

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActiveUsers = await this.lessonProgressModel.distinct('userId', {
      courseId,
      updatedAt: { $gte: weekAgo },
    }).then((ids) => ids.length);

    const lessonOpensByDay = await this.lessonProgressModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { courseId, updatedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const watchAgg = await this.lessonProgressModel.aggregate<{ total: number }>([
      { $match: { courseId } },
      { $group: { _id: null, total: { $sum: '$timeSpentSec' } } },
    ]);

    this.log.log(
      `[ENGAGEMENT_ANALYTICS] courseId=${courseId} durationMs=${Date.now() - started}`,
    );

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      lessonOpensByDay: lessonOpensByDay.map((r) => ({
        date: r._id,
        count: r.count,
      })),
      totalWatchSeconds: watchAgg[0]?.total ?? 0,
      heatmap: [],
    };
  }

  async exportStudentsCsvRows(
    courseId: string,
    instructorId: string,
  ): Promise<string> {
    const lines: string[] = [
      'studentId,progress,lessonsCompleted,totalLessons,quizAverage,quizAttempts,problemsSolved,lastActiveAt,joinedAt,status',
    ];
    let page = 1;
    for (;;) {
      const batch = await this.getStudents(courseId, instructorId, {
        page,
        limit: 100,
      });
      for (const s of batch.items) {
        lines.push(
          [
            s.studentId,
            s.progress,
            s.lessonsCompleted,
            s.totalLessons,
            s.quizAverage,
            s.quizAttempts,
            s.problemsSolved,
            s.lastActiveAt ?? '',
            s.joinedAt ?? '',
            s.enrollmentStatus,
          ].join(','),
        );
      }
      if (!batch.hasMore) break;
      page += 1;
    }
    return lines.join('\n');
  }
}
