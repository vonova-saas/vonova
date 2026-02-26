import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ContentGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  getCourseContentTree(courseId: string, userId: string) {
    return this.client.send({ cmd: 'app.courses.content.getTree' }, { courseId, userId });
  }

  getLessonContent(courseId: string, lessonId: string, userId: string) {
    return this.client.send({ cmd: 'app.courses.content.getLesson' }, { courseId, lessonId, userId });
  }
}
