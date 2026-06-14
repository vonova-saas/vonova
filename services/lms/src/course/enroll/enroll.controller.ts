import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EnrollService } from './enroll.service';
import { CourseAnalyticsService } from './course-analytics.service';

@Controller()
export class EnrollController {
  constructor(
    private readonly enrollService: EnrollService,
    private readonly courseAnalytics: CourseAnalyticsService,
  ) {}

  @MessagePattern({ cmd: 'app.courses.enroll' })
  enroll(
    @Payload()
    data: {
      courseId: string;
      userId: string;
      createdBy?: string;
      user?: { id?: string; sub?: string };
      couponCode?: string;
    },
  ) {
    const { courseId, userId, createdBy, user, couponCode } = data;
    if (!courseId || !userId)
      throw new Error('courseId and userId are required');

    // Extract createdBy from multiple possible sources
    const creatorId = createdBy || user?.id || user?.sub || userId;

    return this.enrollService.enrollCourse(
      courseId,
      userId,
      creatorId,
      couponCode,
    );
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.get' })
  getEnrollment(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId)
      throw new Error('courseId and userId are required');

    return this.enrollService.getEnrollment(courseId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.access' })
  getAccess(
    @Payload() data: { courseId: string; lessonId: string; userId: string },
  ) {
    const { courseId, lessonId, userId } = data;
    if (!courseId || !lessonId || !userId)
      throw new Error('courseId, lessonId and userId are required');

    return this.enrollService.getLessonAccess(courseId, lessonId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.listByUser' })
  listByUser(@Payload() data: { userId: string }) {
    const { userId } = data;
    if (!userId) throw new Error('userId is required');
    // Drop enrollments whose course no longer exists in one query so the
    // gateway doesn't trigger per-row `Course not found` ERROR logs.
    return this.enrollService.listActiveEnrollmentsForUserWithLiveCourse(
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.cancel' })
  cancel(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId) {
      throw new Error('courseId and userId are required');
    }
    return this.enrollService.cancelEnrollment(courseId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.listStudentsByCourse' })
  listStudentsByCourse(
    @Payload()
    data: { courseId: string; cursor?: string; limit?: number },
  ) {
    const { courseId, cursor, limit } = data;
    if (!courseId) throw new Error('courseId is required');
    return this.enrollService.listEnrolledStudentIdsByCourse(courseId, {
      cursor,
      limit,
    });
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.instructorAnalytics' })
  instructorAnalytics(
    @Payload() data: { courseId: string; instructorId: string },
  ) {
    const { courseId, instructorId } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.enrollService.getInstructorCourseAnalytics(
      courseId,
      instructorId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.analytics.overview' })
  analyticsOverview(
    @Payload() data: { courseId: string; instructorId: string },
  ) {
    const { courseId, instructorId } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.courseAnalytics.getOverview(courseId, instructorId);
  }

  @MessagePattern({ cmd: 'app.courses.analytics.students' })
  analyticsStudents(
    @Payload()
    data: {
      courseId: string;
      instructorId: string;
      page?: number;
      limit?: number;
      search?: string;
      sort?: 'progress' | 'quiz' | 'lastActive' | 'joined';
      filter?: 'inactive' | 'completed' | 'lowPerformers';
    },
  ) {
    const { courseId, instructorId, ...opts } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.courseAnalytics.getStudents(courseId, instructorId, opts);
  }

  @MessagePattern({ cmd: 'app.courses.analytics.quizzes' })
  analyticsQuizzes(
    @Payload() data: { courseId: string; instructorId: string },
  ) {
    const { courseId, instructorId } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.courseAnalytics.getQuizzes(courseId, instructorId);
  }

  @MessagePattern({ cmd: 'app.courses.analytics.engagement' })
  analyticsEngagement(
    @Payload() data: { courseId: string; instructorId: string },
  ) {
    const { courseId, instructorId } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.courseAnalytics.getEngagement(courseId, instructorId);
  }

  @MessagePattern({ cmd: 'app.courses.analytics.exportStudents' })
  analyticsExportStudents(
    @Payload() data: { courseId: string; instructorId: string },
  ) {
    const { courseId, instructorId } = data;
    if (!courseId || !instructorId)
      throw new Error('courseId and instructorId are required');
    return this.courseAnalytics.exportStudentsCsvRows(courseId, instructorId);
  }
}
