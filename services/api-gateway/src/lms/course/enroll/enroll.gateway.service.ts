import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EnrollCourseDto } from './dto/enroll.dto';

@Injectable()
export class EnrollGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  enrollCourse(
    courseId: string,
    userId: string,
    createdBy: string,
    dto?: EnrollCourseDto,
  ) {
    return this.client.send(
      { cmd: 'app.courses.enroll' },
      { courseId, userId, createdBy, user: { id: createdBy }, ...dto },
    );
  }

  listEnrolledStudentsByCourse(
    courseId: string,
    opts?: { cursor?: string; limit?: number },
  ) {
    return this.client.send(
      { cmd: 'app.courses.enrollment.listStudentsByCourse' },
      { courseId, cursor: opts?.cursor, limit: opts?.limit },
    );
  }

  getEnrollment(courseId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.enrollment.get' },
      { courseId, userId },
    );
  }

  getLessonAccess(courseId: string, lessonId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.access' },
      { courseId, lessonId, userId },
    );
  }

  listStudentEnrollments(userId: string) {
    return this.client.send(
      { cmd: 'app.courses.enrollment.listByUser' },
      { userId },
    );
  }

  getInstructorCourseAnalytics(courseId: string, instructorId: string) {
    return this.client.send(
      { cmd: 'app.courses.enrollment.instructorAnalytics' },
      { courseId, instructorId },
    );
  }

  getCourseAnalyticsOverview(courseId: string, instructorId: string) {
    return this.client.send(
      { cmd: 'app.courses.analytics.overview' },
      { courseId, instructorId },
    );
  }

  getCourseAnalyticsStudents(
    courseId: string,
    instructorId: string,
    opts?: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: 'progress' | 'quiz' | 'lastActive' | 'joined';
      filter?: 'inactive' | 'completed' | 'lowPerformers';
    },
  ) {
    return this.client.send(
      { cmd: 'app.courses.analytics.students' },
      { courseId, instructorId, ...opts },
    );
  }

  getCourseAnalyticsQuizzes(courseId: string, instructorId: string) {
    return this.client.send(
      { cmd: 'app.courses.analytics.quizzes' },
      { courseId, instructorId },
    );
  }

  getCourseAnalyticsEngagement(courseId: string, instructorId: string) {
    return this.client.send(
      { cmd: 'app.courses.analytics.engagement' },
      { courseId, instructorId },
    );
  }

  exportCourseAnalyticsStudents(courseId: string, instructorId: string) {
    return this.client.send(
      { cmd: 'app.courses.analytics.exportStudents' },
      { courseId, instructorId },
    );
  }
}
