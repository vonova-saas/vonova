import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Asset } from './schema/asset.schema';
import { Chapter } from '../chapter/schema/chapter.schema';
import { Course } from '../course/schema/course.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import { S3Service } from '../../common/utils/storage/s3.service';
import { S3ConfigService } from '../lesson/config/s3.config';
import { EnrollService } from '../enroll/enroll.service';
import { objectKeyFromStoredValue } from '../../common/utils/s3-key.util';
import { resolveLessonVideoForApi } from '../../common/utils/stream-pipeline.util';
import { Quiz } from '../../quiz/schema/quiz.schema';
import { Book } from '../../library/schema/book/book.schema';
import { Guide } from '../../library/schema/guide.schema';
import { Presentation } from '../../library/schema/presentation.schema';
import { Problem } from '../../lms-ai/problem-solving/schemas/problem.schema';
import {
  LessonProgress,
  LessonProgressDocument,
} from '../progress/schema/lesson-progress.schema';

export type LessonContentResourceItem = {
  id: string;
  title: string;
  kind: 'material' | 'quiz' | 'problem';
  materialType?: 'book' | 'guide' | 'presentation';
};

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Guide.name) private guideModel: Model<Guide>,
    @InjectModel(Presentation.name) private presentationModel: Model<Presentation>,
    @InjectModel(Problem.name) private problemModel: Model<Problem>,
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    private s3Service: S3Service,
    /** Lesson video + lesson thumbnail live in AWS_S3_BUCKET_LMS (same as uploads). */
    private readonly lmsContentS3: S3ConfigService,
    private readonly enrollService: EnrollService,
  ) {}

  async getCourseContentTree(courseId: string, userId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const [chapters, lessons] = await Promise.all([
      this.chapterModel.find({ courseId }).sort({ index: 1 }),
      this.lessonModel.find({ courseId }).sort({ chapterId: 1, index: 1 }),
    ]);

    const enrolled = await this.enrollService.isEnrolled(courseId, userId);
    const canContent = await this.enrollService.canAccessCourseContent(
      userId,
      courseId,
    );

    const lessonsByChapter = new Map<string, any[]>();

    for (const l of lessons) {
      const accessible = l.previewable || canContent;
      const arr = lessonsByChapter.get(String(l.chapterId)) || [];

      arr.push({
        id: String(l._id),
        title: l.title,
        index: l.index,
        durationMinutes: l.durationMinutes || 0,
        previewable: l.previewable,
        accessible,
        type: l.type,
      });

      lessonsByChapter.set(String(l.chapterId), arr);
    }

    const tree = chapters.map((c) => ({
      id: String(c._id),
      title: c.title,
      index: c.index,
      lessons: lessonsByChapter.get(String(c._id)) || [],
    }));

    const totalLessons = lessons.length;
    const durationMinutes = lessons.reduce(
      (acc, l) => acc + (l.durationMinutes || 0),
      0,
    );

    return {
      course: { id: String(course._id), title: course.title },
      enrolled,
      totalLessons,
      durationMinutes,
      chapters: tree,
    };
  }

  private async buildLessonResources(
    lesson: Lesson & { _id: Types.ObjectId },
  ): Promise<{
    materials: LessonContentResourceItem[];
    quizzes: LessonContentResourceItem[];
    problems: LessonContentResourceItem[];
  }> {
    const materialIds = lesson.materials ?? [];
    const quizIds = lesson.quizzes ?? [];
    const problemIds = lesson.problems ?? [];

    const materials: LessonContentResourceItem[] = [];
    if (materialIds.length) {
      const ids = materialIds.map((x) => new Types.ObjectId(x));
      const [books, guides, presentations] = await Promise.all([
        this.bookModel.find({ _id: { $in: ids } }).select('title').lean(),
        this.guideModel.find({ _id: { $in: ids } }).select('title').lean(),
        this.presentationModel
          .find({ _id: { $in: ids } })
          .select('title')
          .lean(),
      ]);
      const meta = new Map<string, { title: string; materialType: 'book' | 'guide' | 'presentation' }>();
      for (const b of books) {
        meta.set(String(b._id), { title: String(b.title), materialType: 'book' });
      }
      for (const g of guides) {
        meta.set(String(g._id), { title: String(g.title), materialType: 'guide' });
      }
      for (const p of presentations) {
        meta.set(String(p._id), {
          title: String(p.title),
          materialType: 'presentation',
        });
      }
      for (const mid of materialIds) {
        const id = mid.toString();
        const m = meta.get(id);
        if (m) {
          materials.push({
            id,
            title: m.title,
            kind: 'material',
            materialType: m.materialType,
          });
        }
      }
    }

    const quizzes: LessonContentResourceItem[] = [];
    if (quizIds.length) {
      const docs = await this.quizModel
        .find({ _id: { $in: quizIds } })
        .select('title')
        .lean();
      const byId = new Map(docs.map((q) => [String(q._id), String(q.title)]));
      for (const qid of quizIds) {
        const id = qid.toString();
        const title = byId.get(id);
        if (title)
          quizzes.push({ id, title, kind: 'quiz' });
      }
    }

    const problems: LessonContentResourceItem[] = [];
    if (problemIds.length) {
      const docs = await this.problemModel
        .find({ _id: { $in: problemIds } })
        .select('title functionName')
        .lean();
      const byId = new Map(
        docs.map((p) => [
          String(p._id),
          String(p.title || (p as { functionName?: string }).functionName || 'Problem'),
        ]),
      );
      for (const pid of problemIds) {
        const id = pid.toString();
        const title = byId.get(id);
        if (title) problems.push({ id, title, kind: 'problem' });
      }
    }

    return { materials, quizzes, problems };
  }

  async getLessonContent(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      courseId,
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const can = await this.enrollService.canAccessCourseContent(
      userId,
      courseId,
    );
    if (!lesson.previewable && !can) {
      throw new ForbiddenException(
        'You must enroll in this course to view this lesson',
      );
    }

    const access = { access: true, reason: can ? 'allowed' : 'preview' };

    const legacyUrl = lesson.videoUrl?.trim();
    const videoKeyRaw = lesson.videoObjectKey?.trim() ?? '';
    if (legacyUrl && !videoKeyRaw) {
      this.logger.warn(
        `Legacy video detected: videoUrl without videoObjectKey lessonId=${lessonId} courseId=${courseId}`,
      );
    }

    const presignResult = await resolveLessonVideoForApi(
      videoKeyRaw,
      (k) => this.lmsContentS3.getPresignedGetUrl(k),
    );

    if (presignResult.videoError) {
      this.logger.warn(
        `Lesson video presign degraded lessonId=${lessonId} reason=${presignResult.error?.reason ?? 'unknown'}`,
      );
    } else if (presignResult.streamUrl && videoKeyRaw) {
      const k = objectKeyFromStoredValue(videoKeyRaw);
      this.logger.log(
        `Presigned lesson video lessonId=${lessonId} objectKey=${k ? `${k.slice(0, 64)}…` : 'n/a'}`,
      );
    }

    const streamUrl = presignResult.streamUrl;

    let posterUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (lesson.thumbnailKey) {
      const tk = objectKeyFromStoredValue(lesson.thumbnailKey);
      if (tk) {
        try {
          posterUrl = await this.lmsContentS3.getPresignedGetUrl(tk);
          thumbnailUrl = posterUrl;
          this.logger.debug(`Lesson ${lessonId} thumbnail presigned ok`);
        } catch (e) {
          this.logger.warn(
            `Presign thumbnail failed lessonId=${lessonId}: ${(e as Error).message}`,
          );
        }
      }
    }

    const video = {
      streamUrl,
      videoObjectKey: videoKeyRaw || null,
      videoError: presignResult.videoError,
      ...(presignResult.error ? { error: presignResult.error } : {}),
      ...(posterUrl ? { posterUrl, thumbnailUrl } : {}),
    };

    const resources = await this.buildLessonResources(lesson);

    let lessonCompleted = false;
    if (userId && Types.ObjectId.isValid(userId)) {
      const lp = await this.lessonProgressModel
        .findOne({
          courseId,
          userId,
          lessonId,
          completed: true,
        })
        .select('_id')
        .lean();
      lessonCompleted = !!lp;
    }

    const payload = {
      access: true,
      reason: access.reason,
      lesson: {
        id: String(lesson._id),
        title: lesson.title,
        type: lesson.type,
        durationMinutes: lesson.durationMinutes || 0,
        content: lesson.content?.trim() ? lesson.content : undefined,
        lessonCompleted,
        video,
        resources,
      },
    };

    this.logger.debug(
      `getLessonContent lessonId=${lessonId} streamUrl=${Boolean(payload.lesson.video.streamUrl)} materials=${resources.materials.length} quizzes=${resources.quizzes.length} problems=${resources.problems.length}`,
    );

    return payload;
  }

  async createAssetRecord(
    courseId: string,
    contentType: string,
    contentId: string,
    instructorId: string,
    metadata: {
      originalFileName: string;
      mimeType: string;
      size: number;
      objectKey: string;
    },
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const ct = contentType.toLowerCase();
    const baseReturn = {
      contentId,
      objectKey: metadata.objectKey,
      fileName: metadata.originalFileName,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };

    if (ct === 'chapter') {
      const chapter = await this.chapterModel.findOne({
        _id: contentId,
        courseId,
      });
      if (!chapter) throw new NotFoundException('Chapter not found in course');
      this.logger.log(
        `Content upload (chapter) skipped Asset row objectKey=${metadata.objectKey}`,
      );
      return { ...baseReturn, assetId: '' };
    }

    if (ct === 'course') {
      if (String(course._id) !== String(contentId)) {
        throw new BadRequestException('contentId must match courseId for course uploads');
      }
      this.logger.log(
        `Content upload (course) skipped Asset row objectKey=${metadata.objectKey}`,
      );
      return { ...baseReturn, assetId: '' };
    }

    if (ct !== 'lesson') {
      throw new BadRequestException(`Invalid content type: ${contentType}`);
    }

    const lesson = await this.lessonModel.findOne({ _id: contentId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found in course');

    const asset = new this.assetModel({
      courseId: new Types.ObjectId(courseId),
      lessonId: new Types.ObjectId(contentId),
      ownerId: new Types.ObjectId(instructorId),
      createdBy: new Types.ObjectId(instructorId),
      objectKey: metadata.objectKey,
      originalFileName: metadata.originalFileName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      status: 'UPLOADED',
      urls: {},
    });

    const savedAsset = await asset.save();

    this.logger.log(
      `Asset record created assetId=${String(savedAsset._id)} objectKey=${metadata.objectKey}`,
    );

    return {
      ...baseReturn,
      assetId: String(savedAsset._id),
    };
  }
}
