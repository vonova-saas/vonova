import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../chapter/schema/chapter.schema';
import { Course, CourseDocument } from '../course/schema/course.schema';
import { Lesson, LessonDocument } from './schema/lesson.schema';
import { Asset, AssetDocument } from '../content/schema/asset.schema';
import { CreateLessonDto, ReorderLessonDto, UpdateLessonDto, LessonTypeDto } from './dto/lesson.dto';
import { Quiz, QuizDocument } from '../../quiz/schema/quiz.schema';
import { Assignment, AssignmentDocument } from '../../assignment/schema/assignment.schema';
import { Book, BookDocument } from '../../library/schema/book/book.schema';
import { Guide, GuideDocument } from '../../library/schema/guide.schema';
import {
  Presentation,
  PresentationDocument,
} from '../../library/schema/presentation.schema';
import { S3ConfigService } from './config/s3.config';
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  objectKeyFromStoredValue,
  isLessonVideoContentObjectKey,
} from '../../common/utils/s3-key.util';
import { resolveLessonVideoForApi } from '../../common/utils/stream-pipeline.util';
import { v4 as uuidv4 } from 'uuid';
import * as multer from 'multer';
import { Readable } from 'stream';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Guide.name) private guideModel: Model<GuideDocument>,
    @InjectModel(Presentation.name)
    private presentationModel: Model<PresentationDocument>,
    private readonly s3ConfigService: S3ConfigService,
  ) { }

  private async assertCourseOwner(
    courseId: string,
    ownerId: string,
  ): Promise<CourseDocument> {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('Not owner of course');
    }
    return course;
  }

  /**
   * Tolerant lesson-in-course lookup used by all attach/detach/reorder calls.
   * Mirrors the loose query used by getLesson, which has been observed to match
   * documents that the strict `new Types.ObjectId(courseId)` form misses (e.g.
   * when an old migration or non-cast write left `courseId` stored as a string).
   * Pass `courseId` as a string and let Mongoose's schema-aware casting handle it.
   */
  private async findLessonInCourse(
    courseId: string,
    lessonId: string,
  ): Promise<LessonDocument | null> {
    if (!Types.ObjectId.isValid(lessonId)) return null;
    return this.lessonModel.findOne({ _id: lessonId, courseId });
  }

  private async loadLibraryMaterial(
    materialId: string,
    materialType: string,
  ): Promise<{ doc: BookDocument | GuideDocument | PresentationDocument; model: Model<unknown> } | null> {
    const norm = materialType.toLowerCase().trim();
    if (norm === 'book') {
      const doc = await this.bookModel.findById(materialId);
      return doc ? { doc, model: this.bookModel as Model<unknown> } : null;
    }
    if (norm === 'guide') {
      const doc = await this.guideModel.findById(materialId);
      return doc ? { doc, model: this.guideModel as Model<unknown> } : null;
    }
    if (norm === 'presentation') {
      const doc = await this.presentationModel.findById(materialId);
      return doc
        ? { doc, model: this.presentationModel as Model<unknown> }
        : null;
    }
    return null;
  }

  async attachMaterial(
    courseId: string,
    lessonId: string,
    materialId: string,
    materialType: string,
    ownerId: string,
    visibility?: 'PUBLIC' | 'PRIVATE',
  ) {
    const course = await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const loaded = await this.loadLibraryMaterial(materialId, materialType);
    if (!loaded) throw new NotFoundException('Material not found');

    const creator = String((loaded.doc as { createdBy: Types.ObjectId }).createdBy);
    if (creator !== ownerId) {
      throw new ForbiddenException('You can only attach materials you created');
    }

    const vis =
      visibility ??
      ((course as { visibility?: string }).visibility === 'PUBLIC'
        ? 'PUBLIC'
        : 'PRIVATE');

    await loaded.model.findByIdAndUpdate(materialId, {
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      visibility: vis,
    });

    const matOid = new Types.ObjectId(materialId);
    const mats = lesson.materials ?? [];
    if (!mats.some((m) => m.equals(matOid))) {
      lesson.materials = [...mats, matOid];
      await lesson.save();
    }

    return {
      success: true,
      message: 'Material attached to lesson',
      data: { courseId, lessonId, materialId, materialType, visibility: vis },
    };
  }

  async detachMaterial(
    courseId: string,
    lessonId: string,
    materialId: string,
    ownerId: string,
    materialType?: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.lessonModel.updateOne(
      { _id: lessonId },
      { $pull: { materials: new Types.ObjectId(materialId) } },
    );

    const types = materialType
      ? [materialType]
      : ['book', 'guide', 'presentation'];
    for (const t of types) {
      const loaded = await this.loadLibraryMaterial(materialId, t);
      if (!loaded) continue;
      const cid = (loaded.doc as { courseId?: Types.ObjectId }).courseId;
      const lid = (loaded.doc as { lessonId?: Types.ObjectId }).lessonId;
      if (
        cid?.toString() === courseId &&
        lid?.toString() === lessonId
      ) {
        await loaded.model.findByIdAndUpdate(materialId, {
          $unset: { courseId: 1, lessonId: 1 },
          $set: { visibility: 'PUBLIC' },
        });
      }
    }

    return {
      success: true,
      message: 'Material detached from lesson',
      data: { courseId, lessonId, materialId },
    };
  }

  async reorderLessonMaterials(
    courseId: string,
    lessonId: string,
    orderedMaterialIds: string[],
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const current = new Set(
      (lesson.materials ?? []).map((id) => id.toString()),
    );
    for (const id of orderedMaterialIds) {
      if (!current.has(id)) {
        throw new BadRequestException(
          `Material ${id} is not attached to this lesson`,
        );
      }
    }

    lesson.materials = orderedMaterialIds.map((id) => new Types.ObjectId(id));
    await lesson.save();

    return {
      success: true,
      message: 'Materials reordered',
      data: { lessonId, materials: orderedMaterialIds },
    };
  }

  async attachQuiz(
    courseId: string,
    lessonId: string,
    quizId: string,
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.createdBy.toString() !== ownerId) {
      throw new ForbiddenException('You can only attach quizzes you created');
    }

    const courseOid = new Types.ObjectId(courseId);
    const lessonOid = new Types.ObjectId(lessonId);

    await this.quizModel.findByIdAndUpdate(quizId, {
      courseId: courseOid,
      lessonId: lessonOid,
    });

    const qOid = new Types.ObjectId(quizId);
    const qList = lesson.quizzes ?? [];
    if (!qList.some((q) => q.equals(qOid))) {
      lesson.quizzes = [...qList, qOid];
      if (!lesson.quizId) lesson.quizId = qOid;
      await lesson.save();
    }

    return {
      success: true,
      message: 'Quiz attached to lesson',
      data: { courseId, lessonId, quizId },
    };
  }

  async detachQuiz(
    courseId: string,
    lessonId: string,
    quizId: string,
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.lessonModel.updateOne(
      { _id: lessonId },
      { $pull: { quizzes: new Types.ObjectId(quizId) } },
    );

    const quiz = await this.quizModel.findById(quizId);
    if (
      quiz &&
      quiz.lessonId?.toString() === lessonId &&
      quiz.courseId?.toString() === courseId
    ) {
      await this.quizModel.findByIdAndUpdate(quizId, {
        $unset: { courseId: 1, lessonId: 1 },
      });
    }

    const fresh = await this.lessonModel.findById(lessonId);
    if (fresh) {
      const qids = fresh.quizzes ?? [];
      fresh.quizId = qids.length ? (qids[0] as Types.ObjectId) : null;
      await fresh.save();
    }

    return {
      success: true,
      message: 'Quiz detached from lesson',
      data: { courseId, lessonId, quizId },
    };
  }

  async attachProblem(
    courseId: string,
    lessonId: string,
    problemId: string,
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const pOid = new Types.ObjectId(problemId);
    const plist = lesson.problems ?? [];
    if (!plist.some((p) => p.equals(pOid))) {
      lesson.problems = [...plist, pOid];
      await lesson.save();
    }

    return {
      success: true,
      message: 'Problem attached to lesson',
      data: { courseId, lessonId, problemId },
    };
  }

  async detachProblem(
    courseId: string,
    lessonId: string,
    problemId: string,
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.lessonModel.updateOne(
      { _id: lessonId },
      { $pull: { problems: new Types.ObjectId(problemId) } },
    );

    return {
      success: true,
      message: 'Problem detached from lesson',
      data: { courseId, lessonId, problemId },
    };
  }

  async reorderLessonQuizzes(
    courseId: string,
    lessonId: string,
    orderedQuizIds: string[],
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const allowed = new Set(
      (lesson.quizzes ?? []).map((id) => id.toString()),
    );
    if (orderedQuizIds.length !== allowed.size) {
      throw new BadRequestException(
        'orderedQuizIds must list each attached quiz exactly once',
      );
    }
    if (new Set(orderedQuizIds).size !== orderedQuizIds.length) {
      throw new BadRequestException('Duplicate quiz id in order');
    }
    for (const id of orderedQuizIds) {
      if (!allowed.has(id)) {
        throw new BadRequestException(`Quiz ${id} is not attached to this lesson`);
      }
    }

    lesson.quizzes = orderedQuizIds.map((id) => new Types.ObjectId(id));
    if (orderedQuizIds.length > 0) {
      lesson.quizId = new Types.ObjectId(orderedQuizIds[0]);
    } else {
      lesson.quizId = null;
    }
    await lesson.save();

    return {
      success: true,
      message: 'Quizzes reordered',
      data: { lessonId, quizIds: orderedQuizIds },
    };
  }

  async reorderLessonProblems(
    courseId: string,
    lessonId: string,
    orderedProblemIds: string[],
    ownerId: string,
  ) {
    await this.assertCourseOwner(courseId, ownerId);
    const lesson = await this.findLessonInCourse(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const allowed = new Set(
      (lesson.problems ?? []).map((id) => id.toString()),
    );
    if (orderedProblemIds.length !== allowed.size) {
      throw new BadRequestException(
        'orderedProblemIds must list each attached problem exactly once',
      );
    }
    if (new Set(orderedProblemIds).size !== orderedProblemIds.length) {
      throw new BadRequestException('Duplicate problem id in order');
    }
    for (const id of orderedProblemIds) {
      if (!allowed.has(id)) {
        throw new BadRequestException(
          `Problem ${id} is not attached to this lesson`,
        );
      }
    }

    lesson.problems = orderedProblemIds.map((id) => new Types.ObjectId(id));
    await lesson.save();

    return {
      success: true,
      message: 'Problems reordered',
      data: { lessonId, problemIds: orderedProblemIds },
    };
  }

  async createLesson(
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId,
    dto: CreateLessonDto,
    ownerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const chapter = await this.chapterModel.findOne({ _id: chapterId });
    if (!chapter) throw new NotFoundException('Chapter not found');

    // Build lesson data
    const lessonData: any = {
      courseId,
      chapterId,
      createdBy: ownerId,
      title: dto.title,
      index: dto.index,
      durationMinutes: dto.durationMinutes,
      type: dto.type || 'VIDEO',
      previewable: dto.previewable,
      content: dto.content,
    };

    const newVideoKeyRaw = dto.videoObjectKey ?? dto.videoKey;
    if (newVideoKeyRaw !== undefined) {
      const normalized = objectKeyFromStoredValue(String(newVideoKeyRaw));
      if (normalized.trim()) {
        if (!isLessonVideoContentObjectKey(normalized)) {
          throw new BadRequestException(
            'Invalid lesson video key. Create the lesson first, then upload the video (presigned S3 flow), or leave video empty until upload completes.',
          );
        }
        lessonData.videoObjectKey = normalized;
        lessonData.hasVideo = true;
        lessonData.videoUrl = undefined;
      } else {
        lessonData.videoObjectKey = undefined;
        lessonData.hasVideo = false;
        lessonData.videoUrl = undefined;
      }
    }
    if (dto.thumbnailKey !== undefined) {
      lessonData.thumbnailKey = dto.thumbnailKey || undefined;
    }

    // Handle quiz linking
    if (dto.quizId) {
      const quiz = await this.quizModel.findById(dto.quizId);
      if (!quiz) throw new NotFoundException('Quiz not found');

      // Verify ownership or access
      if (quiz.createdBy.toString() !== ownerId) {
        throw new ForbiddenException('Not authorized to use this quiz');
      }

      lessonData.quizId = new Types.ObjectId(dto.quizId);

      // Update quiz to link to this lesson and course
      await this.quizModel.findByIdAndUpdate(dto.quizId, {
        courseId,
        lessonId: lessonData._id,
      });

      // Set lesson type to QUIZ if not specified
      if (!dto.type) {
        lessonData.type = 'QUIZ';
      }
    }

    // Handle assignment linking
    if (dto.assignmentId) {
      const assignment = await this.assignmentModel.findById(dto.assignmentId);
      if (!assignment) throw new NotFoundException('Assignment not found');

      lessonData.assignmentId = new Types.ObjectId(dto.assignmentId);

      // Update assignment to link to this lesson and course
      await this.assignmentModel.findByIdAndUpdate(dto.assignmentId, {
        courseId,
        lessonId: lessonData._id,
      });

      // Set lesson type based on current type
      if (!dto.type) {
        lessonData.type = lessonData.quizId ? 'MIXED' : 'ASSIGNMENT';
      }
    }

    const lesson = await this.lessonModel.create(lessonData);
    return { message: 'Lesson created successfully', lesson };
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    dto: UpdateLessonDto,
    ownerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Handle quiz linking/unlinking
    if (dto.quizId !== undefined) {
      // Unlink old quiz if exists
      if (lesson.quizId) {
        await this.quizModel.findByIdAndUpdate(lesson.quizId, {
          courseId: null,
          lessonId: null,
        });
      }

      // Link new quiz if provided
      if (dto.quizId) {
        const quiz = await this.quizModel.findById(dto.quizId);
        if (!quiz) throw new NotFoundException('Quiz not found');

        if (quiz.createdBy.toString() !== ownerId) {
          throw new ForbiddenException('Not authorized to use this quiz');
        }

        lesson.quizId = new Types.ObjectId(dto.quizId);

        await this.quizModel.findByIdAndUpdate(dto.quizId, {
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
        });
      } else {
        lesson.quizId = null;
      }
    }

    // Handle assignment linking/unlinking
    if (dto.assignmentId !== undefined) {
      // Unlink old assignment if exists
      if (lesson.assignmentId) {
        await this.assignmentModel.findByIdAndUpdate(lesson.assignmentId, {
          courseId: null,
          lessonId: null,
        });
      }

      // Link new assignment if provided
      if (dto.assignmentId) {
        const assignment = await this.assignmentModel.findById(dto.assignmentId);
        if (!assignment) throw new NotFoundException('Assignment not found');

        lesson.assignmentId = new Types.ObjectId(dto.assignmentId);

        await this.assignmentModel.findByIdAndUpdate(dto.assignmentId, {
          courseId: new Types.ObjectId(courseId),
          lessonId: new Types.ObjectId(lessonId),
        });
      } else {
        lesson.assignmentId = null;
      }
    }

    // Update other fields
    if (dto.title) lesson.title = dto.title;
    if (dto.index !== undefined) lesson.index = dto.index;
    if (dto.durationMinutes !== undefined) lesson.durationMinutes = dto.durationMinutes;
    if (dto.type) lesson.type = dto.type;
    if (dto.previewable !== undefined) lesson.previewable = dto.previewable;
    if (dto.content !== undefined) lesson.content = dto.content;

    const newVideoKeyRaw = dto.videoObjectKey ?? dto.videoKey;
    if (newVideoKeyRaw !== undefined) {
      const normalized = objectKeyFromStoredValue(String(newVideoKeyRaw));
      if (normalized.trim()) {
        if (!isLessonVideoContentObjectKey(normalized)) {
          throw new BadRequestException(
            'Invalid lesson video key. Use the lesson editor upload (presigned S3) or omit the key until upload completes.',
          );
        }
        lesson.videoObjectKey = normalized;
        lesson.hasVideo = true;
        lesson.videoUrl = undefined;
      } else {
        lesson.videoObjectKey = undefined;
        lesson.hasVideo = false;
        lesson.videoUrl = undefined;
      }
    }
    if (dto.thumbnailKey !== undefined) {
      lesson.thumbnailKey = dto.thumbnailKey || undefined;
    }

    // Auto-update lesson type based on linked resources
    if (lesson.quizId && lesson.assignmentId) {
      lesson.type = 'MIXED';
    } else if (lesson.quizId) {
      lesson.type = 'QUIZ';
    } else if (lesson.assignmentId) {
      lesson.type = 'ASSIGNMENT';
    }

    await lesson.save();
    return { message: 'Lesson updated successfully', lesson };
  }

  async reorderLessons(
    courseId: string,
    order: Array<{ lessonId: string; index: number }>,
    userId: string,
  ) {
    console.log('reorderLessons called with:', { courseId, order, userId });

    // Validate ObjectIds before processing
    try {
      new Types.ObjectId(courseId);
    } catch (error) {
      console.error('Invalid courseId format:', courseId);
      throw new Error(`Invalid courseId format: ${courseId}`);
    }

    // Check if user is course owner - use string comparison for courseId
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (course.ownerId.toString() !== userId)
      throw new ForbiddenException('Only course owner can reorder lessons');

    // Validate all lessonIds exist before processing
    const lessonIds = order.map((o) => o.lessonId);
    console.log('Looking for lessons with IDs:', lessonIds);

    const existingLessons = await this.lessonModel.find({
      _id: { $in: lessonIds },
      courseId,
    });

    if (existingLessons.length !== lessonIds.length) {
      const foundIds = existingLessons.map((l) => l._id.toString());
      const missingIds = lessonIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Lessons not found: ${missingIds.join(', ')}`,
      );
    }

    const ops = order.map((o) => {
      try {
        console.log('Processing lesson:', o);
        new Types.ObjectId(o.lessonId);
        return this.lessonModel.updateOne(
          { _id: new Types.ObjectId(o.lessonId), courseId },
          { $set: { index: o.index } },
        );
      } catch (error) {
        console.error('Invalid lessonId format:', o.lessonId);
        throw new Error(`Invalid lessonId format: ${o.lessonId}`);
      }
    });

    await Promise.all(ops);
    return { success: true };
  }

  async deleteLesson(courseId: string, lessonId: string, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await lesson.deleteOne();
    return { message: 'Lesson deleted successfully', lesson };
  }

  /**
   * Presigned PUT for direct browser → S3 upload. Does not write DB until confirm.
   */
  async getLessonVideoPresignedPut(
    courseId: string,
    lessonId: string,
    ownerId: string,
    uploadData: { fileName: string; contentType: string },
  ) {
    await this.assertCourseOwner(courseId, ownerId);

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    let contentType = (uploadData.contentType || 'video/mp4').trim();
    if (!contentType.toLowerCase().startsWith('video/')) {
      throw new BadRequestException('contentType must be a video/* MIME type');
    }
    const slash = contentType.indexOf('/');
    if (slash > 0) {
      const type = contentType.slice(0, slash).toLowerCase();
      const sub = contentType.slice(slash + 1).toLowerCase();
      contentType = `${type}/${sub || 'mp4'}`;
    }

    const safe = uploadData.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `course/${courseId}/content/lesson/${lessonId}/${uuidv4()}-${safe}`;

    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    this.logger.log(
      `S3 presign PUT lessonId=${lessonId} bucket=${bucketName} key=${objectKey}`,
    );

    // Browser uploads use presigned PUT (PutObject). Do not use GetObjectCommand here.
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      uploadUrl,
      objectKey,
    };
  }

  async confirmLessonVideoUpload(
    courseId: string,
    lessonId: string,
    ownerId: string,
    objectKeyRaw: string,
    fileSize?: number,
  ) {
    await this.assertCourseOwner(courseId, ownerId);

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const key = objectKeyFromStoredValue(objectKeyRaw.trim());
    const inLessonScope =
      key.includes(`/content/lesson/${lessonId}/`) ||
      key.includes(`/lessons/${lessonId}/`);
    if (!inLessonScope) {
      throw new BadRequestException('objectKey does not belong to this lesson');
    }

    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    let storedSize = 0;
    try {
      const head = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
      );
      storedSize = head.ContentLength ?? 0;
      const ct = head.ContentType ?? '';
      const ar = head.AcceptRanges ?? '';
      this.logger.log(
        `S3_UPLOAD_SUCCESS: ${JSON.stringify({
          bucket: bucketName,
          key,
          size: storedSize,
          clientFileSize: fileSize,
          contentType: ct,
          acceptRanges: ar,
        })}`,
      );
      if (!ct.toLowerCase().startsWith('video/')) {
        this.logger.warn(
          `Lesson video HeadObject Content-Type is "${ct}" (expected video/*). ORB or <video> may fail — re-upload with a video/* MIME or fix object metadata.`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `S3 head failed after upload key=${key}: ${(e as Error).message}`,
      );
      throw new BadRequestException(
        'Video not found in storage after upload. Check S3 credentials and bucket, then retry.',
      );
    }

    // Refuse to mark the lesson as having a video when the S3 object is empty
    // or far smaller than what the client claimed it sent. This catches the
    // "upload succeeded but body was lost" failure mode (presigned PUT silently
    // accepting 0-byte / chunk-encoded / proxy-truncated requests). Without
    // this guard, the lesson is flagged hasVideo:true and students get a black
    // <video> element with 0:00 duration.
    if (storedSize <= 0) {
      this.logger.error(
        `Refusing confirm: empty S3 object key=${key} (ContentLength=${storedSize}, clientFileSize=${fileSize ?? 'unknown'})`,
      );
      throw new BadRequestException(
        'Uploaded video is empty (0 bytes) on S3. The upload pipeline lost the file body. Re-select the video and try again; if it persists, set NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=false to PUT to S3 directly (requires bucket CORS for PUT).',
      );
    }
    // Allow some flex to account for compression/encoding differences, but a
    // delta this large is almost always a truncated / partial upload.
    if (typeof fileSize === 'number' && fileSize > 0) {
      const ratio = storedSize / fileSize;
      if (ratio < 0.5) {
        this.logger.error(
          `Refusing confirm: S3 object size ${storedSize} is far smaller than client-reported fileSize ${fileSize} (ratio ${ratio.toFixed(3)}) key=${key}`,
        );
        throw new BadRequestException(
          `Uploaded video is incomplete on S3 (${storedSize} bytes vs. ${fileSize} bytes from your browser). The upload was truncated. Re-select the video and try again.`,
        );
      }
    }

    await this.lessonModel.updateOne(
      { _id: lesson._id },
      {
        $set: {
          videoObjectKey: key,
          hasVideo: true,
          type: 'VIDEO',
        },
        $unset: { videoUrl: '' },
      },
    );

    return {
      message: 'Lesson video confirmed',
      objectKey: key,
    };
  }

  async getVideoUrl(objectKey: string) {
    const key = objectKeyFromStoredValue(objectKey);
    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const streamUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { streamUrl };
  }

  async getLesson(lessonId: string, courseId: string) {
    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.videoUrl?.trim() && !(lesson.videoObjectKey ?? '').trim()) {
      this.logger.warn(
        `Legacy video detected: videoUrl without videoObjectKey lessonId=${lessonId} courseId=${courseId}`,
      );
    }

    const lo = lesson.toObject() as unknown as Record<string, unknown>;
    delete lo.videoUrl;

    const videoKeyRaw = (lesson.videoObjectKey ?? '').trim();
    const presignResult = await resolveLessonVideoForApi(
      videoKeyRaw,
      async (k) => {
        const command = new GetObjectCommand({
          Bucket: this.s3ConfigService.getBucketName(),
          Key: k,
        });
        return getSignedUrl(this.s3ConfigService.getClient(), command, {
          expiresIn: 3600,
        });
      },
    );

    if (presignResult.videoError) {
      this.logger.warn(
        `getLesson video presign degraded lessonId=${lessonId} reason=${presignResult.error?.reason ?? 'unknown'}`,
      );
    }

    const lessonResponse = {
      ...lo,
      video: {
        streamUrl: presignResult.streamUrl,
        videoObjectKey: videoKeyRaw || null,
        videoError: presignResult.videoError,
        ...(presignResult.error ? { error: presignResult.error } : {}),
      },
      chapterId: lesson.chapterId,
    };

    return {
      message: 'Lesson retrieved successfully',
      lesson: lessonResponse,
    };
  }

  async createAssetRecord(
    courseId: string,
    chapterId: string,
    lessonId: string,
    instructorId: string,
    metadata: any,
  ) {
    // Verify the instructor has access to the course
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    // Verify the chapter exists and belongs to the course
    const chapter = await this.chapterModel.findOne({
      _id: chapterId,
      courseId,
    });
    if (!chapter) throw new NotFoundException('Chapter not found in course');

    // Verify the lesson exists and belongs to the chapter
    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      chapterId,
      courseId,
    });
    if (!lesson) throw new NotFoundException('Lesson not found in chapter');

    // Create asset record
    const asset = new this.assetModel({
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(lessonId),
      ownerId: new Types.ObjectId(instructorId),
      createdBy: new Types.ObjectId(instructorId),
      provider: 'S3',
      objectKey: metadata.objectKey,
      originalFileName: metadata.originalFileName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      status: 'UPLOADED',
      urls: {},
      createdAt: new Date(),
    });

    const savedAsset = await asset.save();

    return {
      assetId: String(savedAsset._id),
      lessonId,
      objectKey: metadata.objectKey,
      fileName: metadata.originalFileName,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };
  }
}
