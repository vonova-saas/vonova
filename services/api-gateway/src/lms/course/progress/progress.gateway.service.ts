import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  MarkLessonCompleteDto,
  UpdateLessonWatchDto,
} from './dto/progress.dto';

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
    createdBy: string,
    dto: MarkLessonCompleteDto,
  ) {
    return this.client.send(
      { cmd: 'app.courses.progress.complete' },
      {
        courseId,
        lessonId,
        userId,
        createdBy,
        user: { id: createdBy },
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

  updateLessonWatch(
    courseId: string,
    lessonId: string,
    userId: string,
    createdBy: string,
    dto: UpdateLessonWatchDto,
  ) {
    return this.client.send(
      { cmd: 'app.courses.progress.watch' },
      {
        courseId,
        lessonId,
        userId,
        createdBy,
        user: { id: createdBy },
        currentTime: dto.currentTime,
        duration: dto.duration,
      },
    );
  }

  getLessonWatch(courseId: string, lessonId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.progress.getWatch' },
      { courseId, lessonId, userId },
    );
  }
}
