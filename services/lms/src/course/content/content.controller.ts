import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @MessagePattern({ cmd: 'app.courses.content.getTree' })
  async getCourseContentTree(
    @Payload() data: { courseId: string; userId: string },
  ) {
    const { courseId, userId } = data;
    if (!courseId || !userId)
      throw new Error('courseId and userId are required');

    return this.contentService.getCourseContentTree(courseId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.content.getLesson' })
  async getLessonContent(
    @Payload() data: { courseId: string; lessonId: string; userId: string },
  ) {
    const { courseId, lessonId, userId } = data;
    if (!courseId || !lessonId || !userId)
      throw new Error('courseId, lessonId and userId are required');

    return this.contentService.getLessonContent(courseId, lessonId, userId);
  }
}
