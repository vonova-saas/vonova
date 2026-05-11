import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @MessagePattern({ cmd: 'app.courses.content.getTree' })
  async getCourseContentTree(
    @Payload()
    data: {
      courseId: string;
      userId: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, userId, user } = data;
    if (!courseId) throw new Error('courseId is required');

    const extractedUserId =
      userId || user?.id || user?.sub || (user as { _id?: string })?._id;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.contentService.getCourseContentTree(courseId, extractedUserId);
  }

  @MessagePattern({ cmd: 'app.courses.content.getLesson' })
  async getLessonContent(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      userId: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, lessonId, userId, user } = data;
    if (!courseId || !lessonId)
      throw new Error('courseId and lessonId are required');

    const extractedUserId =
      userId || user?.id || user?.sub || (user as { _id?: string })?._id;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.contentService.getLessonContent(
      courseId,
      lessonId,
      extractedUserId,
    );
  }

  @MessagePattern({ cmd: 'course.content.createAsset' })
  async createAssetRecord(
    @Payload()
    data: {
      courseId: string;
      contentType: string;
      contentId: string;
      metadata: any;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, contentType, contentId, metadata, user } = data;
    if (!courseId || !contentType || !contentId) {
      throw new Error('courseId, contentType, and contentId are required');
    }

    const extractedUserId =
      user?.id ||
      user?.sub ||
      (user as { _id?: string } | undefined)?._id?.toString();
    if (!extractedUserId) throw new Error('User identification is required');

    return this.contentService.createAssetRecord(
      courseId,
      contentType,
      contentId,
      extractedUserId,
      metadata,
    );
  }
}
