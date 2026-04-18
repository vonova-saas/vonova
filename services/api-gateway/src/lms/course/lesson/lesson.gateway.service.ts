import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
} from './dto/lesson.dto';

export interface AssetMetadata {
  originalFileName: string;
  mimeType: string;
  size: number;
  objectKey: string;
  fileUrl: string;
}

@Injectable()
export class LessonGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createLesson(
    courseId: string,
    chapterId: string,
    dto: CreateLessonDto,
    ownerId: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.create' },
      { courseId, chapterId, dto, ownerId, user: { id: ownerId } },
    );
  }

  updateLesson(
    courseId: string,
    lessonId: string,
    dto: UpdateLessonDto,
    ownerId: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.update' },
      { courseId, lessonId, dto, ownerId, user: { id: ownerId } },
    );
  }

  reorderLessons(courseId: string, dto: ReorderLessonDto, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.reorder' },
      { courseId, dto, ownerId, user: { id: ownerId } },
    );
  }

  deleteLesson(courseId: string, lessonId: string, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.delete' },
      { courseId, lessonId, ownerId, user: { id: ownerId } },
    );
  }

  uploadVideoDirectly(courseId: string, lessonId: string, videoMetadata: {
  objectKey: string;
  videoUrl: string;
  hasVideo: boolean;
  size: number;
  mimetype: string;
  originalName: string;
}, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.upload.direct' }, 
      { courseId, lessonId, videoMetadata, ownerId, user: { id: ownerId } }
    );
  }

  getVideoUploadUrl(courseId: string, lessonId: string, uploadData: {
  fileName: string;
  contentType: string;
  objectKey: string;
}, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.upload.url' }, 
      { courseId, lessonId, uploadData, ownerId, user: { id: ownerId } }
    );
  }

  getPresignedUploadUrl(objectKey: string, contentType: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.upload.presigned' }, 
      { objectKey, contentType }
    );
  }

  getVideoUrl(objectKey: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.url' }, 
      { objectKey }
    );
  }

  getLesson(lessonId: string, courseId: string) {
    return this.client.send({ cmd: 'app.courses.lessons.get' }, { lessonId, courseId });
  }

  createAssetRecord(
    courseId: string,
    chapterId: string,
    lessonId: string,
    instructorId: string,
    metadata: AssetMetadata,
  ) {
    return this.client.send(
      { cmd: 'lesson.asset.create' },
      {
        courseId,
        chapterId,
        lessonId,
        metadata,
        user: { id: instructorId },
      },
    );
  }
}
