import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @MessagePattern({ cmd: 'app.courses.content.getTree' })
  async getCourseContentTree(
    @Payload() data: { 
      courseId: string; 
      userId: string; 
      user?: { id?: string; sub?: string } 
    },
  ) {
    const { courseId, userId, user } = data;
    if (!courseId) throw new Error('courseId is required');

    // Extract userId from multiple possible sources
    const extractedUserId = userId || user?.id || user?.sub;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.contentService.getCourseContentTree(courseId, extractedUserId);
  }

  @MessagePattern({ cmd: 'app.courses.content.getLesson' })
  async getLessonContent(
    @Payload() data: { 
      courseId: string; 
      lessonId: string; 
      userId: string; 
      user?: { id?: string; sub?: string } 
    },
  ) {
    const { courseId, lessonId, userId, user } = data;
    if (!courseId || !lessonId) throw new Error('courseId and lessonId are required');

    // Extract userId from multiple possible sources
    const extractedUserId = userId || user?.id || user?.sub;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.contentService.getLessonContent(courseId, lessonId, extractedUserId);
  }
}
