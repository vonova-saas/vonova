import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LessonService } from './lesson.service';
import {
  CreateLessonDto,
  ReorderLessonDto,
  UpdateLessonDto
} from './dto/lesson.dto';
import { Types } from 'mongoose';

@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @MessagePattern({ cmd: 'app.courses.lessons.create' })
  createLesson(
    @Payload()
    data: {
      courseId: Types.ObjectId;
      chapterId: Types.ObjectId;
      dto: CreateLessonDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, chapterId, dto, ownerId, user } = data;
    if (!courseId || !chapterId || !dto) throw new Error('courseId, chapterId and dto are required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.lessonService.createLesson(courseId, chapterId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.update' })
  updateLesson(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: UpdateLessonDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, lessonId, dto, ownerId, user } = data;
    if (!courseId || !lessonId || !dto)
      throw new Error('courseId, lessonId and dto are required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.lessonService.updateLesson(courseId, lessonId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.reorder' })
  reorderLessons(
    @Payload()
    data: {
      courseId: string;
      dto: ReorderLessonDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, dto, ownerId, user } = data;
    console.log('Reorder lessons payload:', JSON.stringify(data, null, 2));
    
    if (!courseId || !dto) {
      console.error('Missing required fields:', { courseId, dto });
      throw new Error('courseId and dto are required');
    }
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) {
      console.error('Missing user identification:', { ownerId, user });
      throw new Error('User identification is required');
    }

    console.log('Processing reorder:', { courseId, order: dto.order, userId });
    return this.lessonService.reorderLessons(courseId, dto.order, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.delete' })
  deleteLesson(
    @Payload() data: { courseId: string; lessonId: string; ownerId?: string; user?: { id?: string; sub?: string } },
  ) {
    const { courseId, lessonId, ownerId, user } = data;
    if (!courseId || !lessonId)
      throw new Error('courseId and lessonId are required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.lessonService.deleteLesson(courseId, lessonId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.upload.presigned' })
  getPresignedUploadUrl(@Payload() data: { objectKey: string; contentType: string }) {
    const { objectKey, contentType } = data;
    if (!objectKey || !contentType) throw new Error('objectKey and contentType are required');

    return this.lessonService.getPresignedUploadUrl(objectKey, contentType);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.url' })
  getVideoUrl(@Payload() data: { objectKey: string }) {
    const { objectKey } = data;
    if (!objectKey) throw new Error('objectKey is required');

    return this.lessonService.getVideoUrl(objectKey);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.upload.direct' })
  uploadVideoDirectly(@Payload() data: { 
    courseId: string; 
    lessonId: string; 
    videoMetadata: {
      objectKey: string;
      videoUrl: string;
      hasVideo: boolean;
      size: number;
      mimetype: string;
      originalName: string;
    }; 
    ownerId: string 
  }) {
    const { courseId, lessonId, videoMetadata, ownerId } = data;
    if (!courseId || !lessonId || !videoMetadata || !ownerId) throw new Error('courseId, lessonId, videoMetadata and ownerId are required');

    return this.lessonService.uploadVideoDirectly(courseId, lessonId, videoMetadata, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.get' })
  getLesson(@Payload() data: { lessonId: string; courseId: string }) {
    const { lessonId, courseId } = data;
    if (!lessonId || !courseId) throw new Error('lessonId and courseId are required');

    return this.lessonService.getLesson(lessonId, courseId);
  }

  @MessagePattern({ cmd: 'lesson.asset.create' })
  async createAssetRecord(
    @Payload() data: { 
      courseId: string;
      chapterId: string;
      lessonId: string;
      metadata: any;
      user?: { id?: string; sub?: string } 
    },
  ) {
    const { courseId, chapterId, lessonId, metadata, user } = data;
    if (!courseId || !chapterId || !lessonId) {
      throw new Error('courseId, chapterId, and lessonId are required');
    }

    // Extract userId from multiple possible sources
    const extractedUserId = user?.id || user?.sub;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.lessonService.createAssetRecord(courseId, chapterId, lessonId, extractedUserId, metadata);
  }
}
