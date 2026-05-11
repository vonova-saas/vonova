import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

@Injectable()
export class EnrollService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(QuizAnswer.name) private quizAnswerModel: Model<QuizAnswer>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
  ) {}

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
    if (visibility === 'PUBLIC') return true;

    if (!userId) return false;

    const ownerId = String((course as { ownerId?: Types.ObjectId }).ownerId ?? '');
    if (ownerId === userId) return true;

    return this.isEnrolled(courseId, userId);
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

    return this.enrollmentModel.create({
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
  }

  async getEnrollment(courseId: string, userId: string) {
    const enrollment = await this.enrollmentModel.findOne({ courseId, userId });
    if (!enrollment) throw new NotFoundException('Not enrolled');
    return enrollment;
  }

  async isEnrolled(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await this.enrollmentModel.findOne({
      courseId,
      userId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });
    return !!enrollment;
  }

  async listActiveEnrollmentsForUser(userId: string) {
    return this.enrollmentModel
      .find({ userId, status: { $in: ['ACTIVE', 'COMPLETED'] } })
      .sort({ updatedAt: -1 })
      .lean();
  }

  async getLessonAccess(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const canContent = await this.canAccessCourseContent(userId, courseId);
    const preview = !!lesson.previewable;
    const access = preview || canContent;

    return {
      access,
      reason: access
        ? preview && !canContent
          ? 'preview'
          : 'allowed'
        : 'forbidden',
      previewable: preview,
    };
  }

  async recalculateEnrollmentProgress(courseId: string, userId: string) {
    const enrollment = await this.enrollmentModel.findOne({ courseId, userId });
    if (!enrollment) return;

    const [total, completed] = await Promise.all([
      this.lessonModel.countDocuments({ courseId }),
      this.lessonProgressModel.countDocuments({
        courseId,
        userId,
        completed: true,
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
      { courseId, userId },
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
    await this.enrollmentModel.findOneAndUpdate(
      { courseId, userId },
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
    const e = await this.enrollmentModel
      .findOne({ courseId, userId })
      .select('lastLessonId lastAccessedAt progressPercentage')
      .lean();
    if (!e) return null;
    return {
      lastLessonId: e.lastLessonId ? String(e.lastLessonId) : null,
      lastAccessedAt: e.lastAccessedAt ?? null,
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
      .find({ courseId: courseOid, quizId: { $exists: true, $ne: null } })
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
        const totalLessons = await this.lessonModel.countDocuments({
          courseId,
        });

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
