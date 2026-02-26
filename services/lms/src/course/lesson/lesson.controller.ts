import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LessonService } from './lesson.service';
import { CreateLessonDto, ReorderLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { Types } from 'mongoose';

@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @MessagePattern({ cmd: 'app.courses.lessons.create' })
  createLesson(@Payload() data: { courseId: Types.ObjectId; chapterId: Types.ObjectId; dto: CreateLessonDto; ownerId: string }) {
    const { courseId, chapterId, dto, ownerId } = data;
    if (!courseId || !chapterId || !dto || !ownerId) throw new Error('courseId, chapterId, dto and ownerId are required');

    return this.lessonService.createLesson(courseId, chapterId, dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.update' })
  updateLesson(@Payload() data: { courseId: string; lessonId: string; dto: UpdateLessonDto; ownerId: string }) {
    const { courseId, lessonId, dto, ownerId } = data;
    if (!courseId || !lessonId || !dto || !ownerId) throw new Error('courseId, lessonId, dto and ownerId are required');

    return this.lessonService.updateLesson(courseId, lessonId, dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.reorder' })
  reorderLessons(@Payload() data: { courseId: string; dto: ReorderLessonDto; ownerId: string }) {
    const { courseId, dto, ownerId } = data;
    if (!courseId || !dto || !ownerId) throw new Error('courseId, dto and ownerId are required');

    return this.lessonService.reorderLessons(courseId, dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.delete' })
  deleteLesson(@Payload() data: { courseId: string; lessonId: string; ownerId: string }) {
    const { courseId, lessonId, ownerId } = data;
    if (!courseId || !lessonId || !ownerId) throw new Error('courseId, lessonId and ownerId are required');

    return this.lessonService.deleteLesson(courseId, lessonId, ownerId);
  }
}