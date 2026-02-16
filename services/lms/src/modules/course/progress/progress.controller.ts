import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@Controller('courses')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post(':courseId/lessons/:lessonId/complete')
  complete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkLessonCompleteDto,
  ) {
    const userId = 'mockUserId';
    return this.progressService.markLessonComplete(
      courseId,
      lessonId,
      userId,
      dto.completed,
      dto.timeSpentSec,
    );
  }

  @Get(':courseId/progress/me')
  myProgress(@Param('courseId') courseId: string) {
    const userId = 'mockUserId';
    return this.progressService.getMyCourseProgress(courseId, userId);
  }
}
