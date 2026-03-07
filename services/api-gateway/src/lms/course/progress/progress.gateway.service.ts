import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@Injectable()
export class ProgressGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  markLessonComplete(
    courseId: string,
    lessonId: string,
    userId: string,
    dto: MarkLessonCompleteDto,
  ) {
    return this.client.send(
      { cmd: 'app.courses.progress.complete' },
      {
        courseId,
        lessonId,
        userId,
        completed: dto.completed,
        timeSpentSec: dto.timeSpentSec,
      },
    );
  }

  getMyCourseProgress(courseId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.progress.getMy' },
      { courseId, userId },
    );
  }
}
