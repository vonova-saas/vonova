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

  getLessonVideoPresignedPut(
    courseId: string,
    lessonId: string,
    uploadData: { fileName: string; contentType: string },
    ownerId: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.upload.url' },
      { courseId, lessonId, uploadData, ownerId, user: { id: ownerId } },
    );
  }

  confirmLessonVideoUpload(
    courseId: string,
    lessonId: string,
    objectKey: string,
    ownerId: string,
    fileSize?: number,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.upload.confirm' },
      {
        courseId,
        lessonId,
        objectKey,
        fileSize,
        ownerId,
        user: { id: ownerId },
      },
    );
  }

  getVideoUrl(objectKey: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.video.url' },
      { objectKey },
    );
  }

  getLesson(lessonId: string, courseId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.get' },
      { lessonId, courseId },
    );
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

  attachMaterial(
    courseId: string,
    lessonId: string,
    ownerId: string,
    dto: {
      materialId: string;
      materialType: string;
      visibility?: string;
    },
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.attachMaterial' },
      { courseId, lessonId, dto, ownerId, user: { id: ownerId } },
    );
  }

  detachMaterial(
    courseId: string,
    lessonId: string,
    materialId: string,
    ownerId: string,
    materialType?: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.detachMaterial' },
      {
        courseId,
        lessonId,
        materialId,
        materialType,
        ownerId,
        user: { id: ownerId },
      },
    );
  }

  reorderLessonMaterials(
    courseId: string,
    lessonId: string,
    ownerId: string,
    dto: { orderedMaterialIds: string[] },
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.reorderMaterials' },
      { courseId, lessonId, dto, ownerId, user: { id: ownerId } },
    );
  }

  attachQuiz(courseId: string, lessonId: string, ownerId: string, quizId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.attachQuiz' },
      {
        courseId,
        lessonId,
        dto: { quizId },
        ownerId,
        user: { id: ownerId },
      },
    );
  }

  detachQuiz(courseId: string, lessonId: string, quizId: string, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.lessons.detachQuiz' },
      { courseId, lessonId, quizId, ownerId, user: { id: ownerId } },
    );
  }

  attachProblem(
    courseId: string,
    lessonId: string,
    ownerId: string,
    problemId: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.attachProblem' },
      {
        courseId,
        lessonId,
        dto: { problemId },
        ownerId,
        user: { id: ownerId },
      },
    );
  }

  detachProblem(
    courseId: string,
    lessonId: string,
    problemId: string,
    ownerId: string,
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.detachProblem' },
      { courseId, lessonId, problemId, ownerId, user: { id: ownerId } },
    );
  }

  reorderLessonQuizzes(
    courseId: string,
    lessonId: string,
    ownerId: string,
    dto: { orderedQuizIds: string[] },
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.reorderQuizzes' },
      { courseId, lessonId, dto, ownerId, user: { id: ownerId } },
    );
  }

  reorderLessonProblems(
    courseId: string,
    lessonId: string,
    ownerId: string,
    dto: { orderedProblemIds: string[] },
  ) {
    return this.client.send(
      { cmd: 'app.courses.lessons.reorderProblems' },
      { courseId, lessonId, dto, ownerId, user: { id: ownerId } },
    );
  }
}
