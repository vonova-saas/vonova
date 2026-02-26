import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
} from './dto/lesson.dto';

@Injectable()
export class LessonGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createLesson(courseId: string, chapterId: string, dto: CreateLessonDto, ownerId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.create' }, { courseId, chapterId, dto, ownerId });
  }

  updateLesson(courseId: string, lessonId: string, dto: UpdateLessonDto, ownerId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.update' }, { courseId, lessonId, dto, ownerId });
  }

  reorderLessons(courseId: string, dto: ReorderLessonDto, ownerId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.reorder' }, { courseId, dto, ownerId });
  }

  deleteLesson(courseId: string, lessonId: string, ownerId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.delete' }, { courseId, lessonId, ownerId });
  }
}
