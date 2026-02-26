import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EnrollService } from './enroll.service';

@Controller()
export class EnrollController {
  constructor(private readonly enrollService: EnrollService) {}

  @MessagePattern({ cmd: 'app.courses.enroll' })
  enroll(@Payload() data: { courseId: string; userId: string; couponCode?: string }) {
    const { courseId, userId, couponCode } = data;
    if (!courseId || !userId) throw new Error('courseId and userId are required');

    return this.enrollService.enrollCourse(courseId, userId, couponCode);
  }

  @MessagePattern({ cmd: 'app.courses.enrollment.get' })
  getEnrollment(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId) throw new Error('courseId and userId are required');

    return this.enrollService.getEnrollment(courseId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.access' })
  getAccess(@Payload() data: { courseId: string; lessonId: string; userId: string }) {
    const { courseId, lessonId, userId } = data;
    if (!courseId || !lessonId || !userId) throw new Error('courseId, lessonId and userId are required');

    return this.enrollService.getLessonAccess(courseId, lessonId, userId);
  }
}