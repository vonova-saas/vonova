import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface AssetMetadata {
  originalFileName: string;
  mimeType: string;
  size: number;
  objectKey: string;
}

@Injectable()
export class ContentGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  getCourseContentTree(courseId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.content.getTree' },
      { courseId, userId, user: { id: userId } },
    );
  }

  getLessonContent(courseId: string, lessonId: string, userId: string) {
    return this.client.send(
      { cmd: 'app.courses.content.getLesson' },
      { courseId, lessonId, userId, user: { id: userId } },
    );
  }

  createAssetRecord(
    courseId: string,
    contentType: string,
    contentId: string,
    instructorId: string,
    metadata: AssetMetadata,
  ) {
    return this.client.send(
      { cmd: 'course.content.createAsset' },
      {
        courseId,
        contentType,
        contentId,
        metadata,
        user: { id: instructorId },
      },
    );
  }
}
