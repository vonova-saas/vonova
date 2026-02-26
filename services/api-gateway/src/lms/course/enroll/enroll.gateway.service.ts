import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EnrollCourseDto } from './dto/enroll.dto';

@Injectable()
export class EnrollGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  enrollCourse(courseId: string, userId: string, dto?: EnrollCourseDto) {
    return this.client.send({ cmd: 'app.courses.enroll' }, { courseId, userId, ...dto });
  }

  getEnrollment(courseId: string, userId: string) {
    return this.client.send({ cmd: 'app.courses.enrollment.get' }, { courseId, userId });
  }

  getLessonAccess(courseId: string, lessonId: string, userId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.access' }, { courseId, lessonId, userId });
  }
}
