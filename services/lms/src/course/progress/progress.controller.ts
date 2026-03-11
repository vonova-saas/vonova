import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProgressService } from './progress.service';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @MessagePattern({ cmd: 'app.courses.progress.complete' })
  complete(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      userId: string;
      createdBy?: string;
      user?: { id?: string; sub?: string };
      completed: boolean;
      timeSpentSec: number;
    },
  ) {
    const { courseId, lessonId, userId, createdBy, user, completed, timeSpentSec } = data;
    if (!courseId || !lessonId || !userId)
      throw new Error('courseId, lessonId and userId are required');

    // Extract createdBy from multiple possible sources
    const creatorId = createdBy || user?.id || user?.sub || userId;

    return this.progressService.markLessonComplete(
      courseId,
      lessonId,
      userId,
      creatorId,
      completed,
      timeSpentSec,
    );
  }

  @MessagePattern({ cmd: 'app.courses.progress.getMy' })
  myProgress(@Payload() data: { courseId: string; userId: string }) {
    const { courseId, userId } = data;
    if (!courseId || !userId)
      throw new Error('courseId and userId are required');

    return this.progressService.getMyCourseProgress(courseId, userId);
  }
}
