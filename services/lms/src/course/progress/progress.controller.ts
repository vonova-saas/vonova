import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProgressService } from './progress.service';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @MessagePattern({ cmd: 'app.courses.progress.complete' })
  complete(@Payload() data: { courseId: string; lessonId: string; userId: string; completed: boolean; timeSpentSec: number }) {
    const { courseId, lessonId, userId, completed, timeSpentSec } = data;
    if (!courseId || !lessonId || !userId) throw new Error('courseId, lessonId and userId are required');

    return this.progressService.markLessonComplete(courseId, lessonId, userId, completed, timeSpentSec);
  }

  @MessagePattern({ cmd: 'app.courses.progress.getMy' })
  myProgress(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId) throw new Error('courseId and userId are required');

    return this.progressService.getMyCourseProgress(courseId, userId);
  }
}