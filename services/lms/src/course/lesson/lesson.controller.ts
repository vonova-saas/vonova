import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { LessonService } from './lesson.service';
import {
  CreateLessonDto,
  ReorderLessonDto,
  UpdateLessonDto,
} from './dto/lesson.dto';
import {
  AttachLessonMaterialDto,
  AttachLessonQuizDto,
  AttachLessonProblemDto,
  ReorderLessonMaterialsDto,
  ReorderLessonQuizzesDto,
  ReorderLessonProblemsDto,
} from './dto/lesson-resources.dto';
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
    if (!courseId || !chapterId || !dto)
      throw new Error('courseId, chapterId and dto are required');

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
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
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
  getPresignedUploadUrl() {
    throw new RpcException(
      'Video upload must use presigned S3 flow only: presign-put → browser PUT to S3 → confirm.',
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.url' })
  getVideoUrl(
    @Payload()
    data: { objectKey: string; courseId: string; lessonId: string },
  ) {
    const { objectKey, courseId, lessonId } = data;
    if (!objectKey) throw new Error('objectKey is required');
    if (!courseId || !lessonId) {
      throw new Error('courseId and lessonId are required');
    }

    return this.lessonService.getVideoUrl(objectKey, courseId, lessonId);
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.upload.url' })
  getLessonVideoPresignedPut(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      uploadData: { fileName: string; contentType: string };
      ownerId?: string;
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { courseId, lessonId, uploadData, ownerId, user } = data;
    if (!courseId || !lessonId || !uploadData?.fileName || !uploadData?.contentType) {
      throw new Error('courseId, lessonId, fileName, and contentType are required');
    }
    const userId =
      ownerId ||
      user?.id ||
      user?.sub ||
      (user?._id != null ? String(user._id) : undefined);
    if (!userId) throw new Error('User identification is required');

    return this.lessonService.getLessonVideoPresignedPut(
      courseId,
      lessonId,
      userId,
      uploadData,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.upload.confirm' })
  confirmLessonVideoUpload(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      objectKey: string;
      fileSize?: number;
      ownerId?: string;
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { courseId, lessonId, objectKey, fileSize, ownerId, user } = data;
    if (!courseId || !lessonId || !objectKey) {
      throw new Error('courseId, lessonId, and objectKey are required');
    }
    const userId =
      ownerId ||
      user?.id ||
      user?.sub ||
      (user?._id != null ? String(user._id) : undefined);
    if (!userId) throw new Error('User identification is required');

    return this.lessonService.confirmLessonVideoUpload(
      courseId,
      lessonId,
      userId,
      objectKey,
      fileSize,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.video.upload.direct' })
  uploadVideoDirectly() {
    throw new RpcException(
      'Multipart / direct video upload is disabled. Use presign-put → S3 PUT → confirm only.',
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.get' })
  getLesson(@Payload() data: { lessonId: string; courseId: string }) {
    const { lessonId, courseId } = data;
    if (!lessonId || !courseId)
      throw new Error('lessonId and courseId are required');

    return this.lessonService.getLesson(lessonId, courseId);
  }

  @MessagePattern({ cmd: 'lesson.asset.create' })
  async createAssetRecord(
    @Payload()
    data: {
      courseId: string;
      chapterId: string;
      lessonId: string;
      metadata: any;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, chapterId, lessonId, metadata, user } = data;
    if (!courseId || !chapterId || !lessonId) {
      throw new Error('courseId, chapterId, and lessonId are required');
    }

    // Extract userId from multiple possible sources
    const extractedUserId = user?.id || user?.sub;
    if (!extractedUserId) throw new Error('User identification is required');

    return this.lessonService.createAssetRecord(
      courseId,
      chapterId,
      lessonId,
      extractedUserId,
      metadata,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.attachMaterial' })
  attachMaterial(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: AttachLessonMaterialDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.attachMaterial(
      data.courseId,
      data.lessonId,
      data.dto.materialId,
      data.dto.materialType,
      userId,
      data.dto.visibility,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.detachMaterial' })
  detachMaterial(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      materialId: string;
      materialType?: string;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.detachMaterial(
      data.courseId,
      data.lessonId,
      data.materialId,
      userId,
      data.materialType,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.reorderMaterials' })
  reorderMaterials(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: ReorderLessonMaterialsDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.reorderLessonMaterials(
      data.courseId,
      data.lessonId,
      data.dto.orderedMaterialIds,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.attachQuiz' })
  attachQuiz(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: AttachLessonQuizDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.attachQuiz(
      data.courseId,
      data.lessonId,
      data.dto.quizId,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.detachQuiz' })
  detachQuiz(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      quizId: string;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.detachQuiz(
      data.courseId,
      data.lessonId,
      data.quizId,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.attachProblem' })
  attachProblem(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: AttachLessonProblemDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.attachProblem(
      data.courseId,
      data.lessonId,
      data.dto.problemId,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.detachProblem' })
  detachProblem(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      problemId: string;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.detachProblem(
      data.courseId,
      data.lessonId,
      data.problemId,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.reorderQuizzes' })
  reorderQuizzes(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: ReorderLessonQuizzesDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.reorderLessonQuizzes(
      data.courseId,
      data.lessonId,
      data.dto.orderedQuizIds,
      userId,
    );
  }

  @MessagePattern({ cmd: 'app.courses.lessons.reorderProblems' })
  reorderProblems(
    @Payload()
    data: {
      courseId: string;
      lessonId: string;
      dto: ReorderLessonProblemsDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const userId = data.ownerId || data.user?.id || data.user?.sub;
    if (!userId) throw new Error('User identification is required');
    return this.lessonService.reorderLessonProblems(
      data.courseId,
      data.lessonId,
      data.dto.orderedProblemIds,
      userId,
    );
  }
}
