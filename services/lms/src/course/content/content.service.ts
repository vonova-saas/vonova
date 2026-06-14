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
import {
  buildStableLmsLessonPosterUrl,
  buildStableMediaPath,
} from '../../common/media/stable-media-url';
import { Quiz } from '../../quiz/schema/quiz.schema';
import { Book } from '../../library/schema/book/book.schema';
import { Guide } from '../../library/schema/guide.schema';
import { Presentation } from '../../library/schema/presentation.schema';
import { Problem } from '../../lms-ai/problem-solving/schemas/problem.schema';
import {
  LessonProgress,
  LessonProgressDocument,
} from '../progress/schema/lesson-progress.schema';
import {
  flattenLessonOrder,
  isChapterUnlocked,
  isLessonUnlockedInSequence,
} from '../enroll/utils/lesson-sequence.util';
import { LessonProgressionEngine } from '../progress/lesson-progression.engine';
import {
  ProblemSheet,
  ProblemSheetDocument,
} from '../../lms-ai/problem-solving/schemas/problem-sheet.schema';
import {
  SheetProgress,
  SheetProgressDocument,
} from '../../lms-ai/problem-solving/schemas/sheet-progress.schema';
import { LMS_AI_CONNECTION_NAME } from '../../lms-ai/database/constants';

export type LessonVideoStreamMetaResult =
  | { error: null; objectKey: string; contentType: string }
  | {
      error: 'not_found' | 'forbidden' | 'no_video';
      message?: string;
    };

type ContentTreeLessonItem = {
  id: string;
  title: string;
  index: number;
  durationMinutes: number;
  previewable: boolean;
  accessible: boolean;
  locked: boolean;
  type: Lesson['type'];
};

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
    @InjectModel(Presentation.name)
    private presentationModel: Model<Presentation>,
    @InjectModel(Problem.name) private problemModel: Model<Problem>,
    @InjectModel(LessonProgress.name)
    private lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(ProblemSheet.name, LMS_AI_CONNECTION_NAME)
    private problemSheetModel: Model<ProblemSheetDocument>,
    @InjectModel(SheetProgress.name, LMS_AI_CONNECTION_NAME)
    private sheetProgressModel: Model<SheetProgressDocument>,
    private s3Service: S3Service,
    /** Lesson video + lesson thumbnail live in AWS_S3_BUCKET_LMS (same as uploads). */
    private readonly lmsContentS3: S3ConfigService,
    private readonly enrollService: EnrollService,
    private readonly progressionEngine: LessonProgressionEngine,
  ) {}

  /**
   * Chapters/lessons may have courseId stored as ObjectId or as a legacy string;
   * querying only ObjectId yields empty trees while the course document still loads.
   */
  private matchCourseId(
    courseOid: Types.ObjectId,
    courseIdStr: string,
  ): { $or: Array<{ courseId: Types.ObjectId } | { courseId: string }> } {
    return {
      $or: [{ courseId: courseOid }, { courseId: courseIdStr }],
    };
  }

  private matchUserId(
    userOid: Types.ObjectId,
    userIdStr: string,
  ): { $or: Array<{ userId: Types.ObjectId } | { userId: string }> } {
    return {
      $or: [{ userId: userOid }, { userId: userIdStr }],
    };
  }

  private sameActorId(a: unknown, b: unknown): boolean {
    if (a == null || b == null) return false;
    const toId = (v: unknown) => {
      if (v instanceof Types.ObjectId) return v.toHexString();
      if (typeof v === 'string' || typeof v === 'number') return String(v);
      if (typeof v === 'object' && v !== null && '_id' in v) {
        return toId((v as { _id?: unknown })._id);
      }
      return '';
    };
    const sa = toId(a).trim();
    const sb = toId(b).trim();
    if (!sa || !sb) return false;
    if (sa === sb) return true;
    if (Types.ObjectId.isValid(sa) && Types.ObjectId.isValid(sb)) {
      try {
        return new Types.ObjectId(sa).equals(new Types.ObjectId(sb));
      } catch {
        return false;
      }
    }
    return false;
  }

  private async getLessonSheetRequirements(
    lessonId: Types.ObjectId,
    userId?: string,
  ): Promise<{ requiredSheetIds: string[]; completedSheetIds: string[] }> {
    const sheets = await this.problemSheetModel
      .find({ lessonId, status: 'published' })
      .select('_id')
      .lean();
    const requiredSheetIds = sheets.map((sheet) => String(sheet._id));
    if (!userId || requiredSheetIds.length === 0) {
      return { requiredSheetIds, completedSheetIds: [] };
    }

    const completed = await this.sheetProgressModel
      .find({
        studentId: userId,
        sheetId: { $in: requiredSheetIds },
        completed: true,
      })
      .select('sheetId')
      .lean();

    return {
      requiredSheetIds,
      completedSheetIds: completed.map((row) => String(row.sheetId)),
    };
  }

  private mapLessonTreeItem(
    l: Lesson & { _id: Types.ObjectId },
    canContent: boolean,
    locked = false,
  ): ContentTreeLessonItem {
    const baseAccess = l.previewable || canContent;
    const accessible = baseAccess && !locked;
    return {
      id: String(l._id),
      title: l.title,
      index: l.index,
      durationMinutes: l.durationMinutes || 0,
      previewable: l.previewable,
      accessible,
      locked,
      type: l.type,
    };
  }

  private async applySequentialLocksToTree(
    tree: Array<{
      id: string;
      title: string;
      index: number;
      lessons: ContentTreeLessonItem[];
    }>,
    courseId: string,
    userId: string,
    canContent: boolean,
    isOwner: boolean,
  ) {
    if (isOwner || !canContent) {
      return tree.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => ({
          ...l,
          locked: false,
          accessible: l.previewable || canContent || isOwner,
        })),
      }));
    }

    const completedRows = await this.lessonProgressModel
      .find({
        ...this.matchCourseId(new Types.ObjectId(courseId), courseId),
        ...this.matchUserId(new Types.ObjectId(userId), userId),
        completed: true,
      })
      .select('lessonId')
      .lean();
    const completed = new Set(completedRows.map((r) => String(r.lessonId)));

    const chapterMeta = tree.map((ch) => ({
      id: ch.id,
      index: ch.index,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        previewable: l.previewable,
        index: l.index,
      })),
    }));
    const flatOrder = flattenLessonOrder(chapterMeta);

    return tree.map((ch, chapterIndex) => {
      const chapterLocked =
        chapterIndex > 0 &&
        !isChapterUnlocked(chapterIndex, chapterMeta, completed);

      return {
        ...ch,
        lessons: ch.lessons.map((l) => {
          const lessonLocked =
            chapterLocked ||
            !isLessonUnlockedInSequence(
              l.id,
              flatOrder,
              completed,
              l.previewable,
            );
          return {
            ...l,
            locked: lessonLocked,
            accessible: (l.previewable || canContent) && !lessonLocked,
          };
        }),
      };
    });
  }

  async getCourseContentTree(courseId: string, userId: string) {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) {
      throw new NotFoundException('Course not found');
    }
    const courseOid = new Types.ObjectId(courseIdStr);

    const course = await this.courseModel.findById(courseOid);
    if (!course) throw new NotFoundException('Course not found');

    const courseFilter = this.matchCourseId(courseOid, courseIdStr);
    const [chapters, lessons] = await Promise.all([
      this.chapterModel.find(courseFilter).sort({ index: 1 }).lean(),
      this.lessonModel
        .find(courseFilter)
        .sort({ chapterId: 1, index: 1 })
        .lean(),
    ]);

    this.logger.log(
      `[content-tree] courseId=${courseIdStr} chapters=${chapters.length} lessons=${lessons.length}`,
    );

    const enrolled = await this.enrollService.isEnrolled(courseIdStr, userId);
    const canContent = await this.enrollService.canAccessCourseContent(
      userId,
      courseIdStr,
    );
    const isOwner = this.sameActorId(
      (course as { ownerId?: unknown }).ownerId,
      userId,
    );
    const canTreeLessons = canContent || isOwner;

    this.logger.log(
      `[COURSE_PREVIEW_LOAD] courseId=${courseIdStr} userId=${String(userId)} isOwner=${isOwner} enrolled=${enrolled} canAccessContent=${canContent} chapters=${chapters.length} lessons=${lessons.length}`,
    );

    const chapterIdSet = new Set(
      chapters.map((c) => String((c as { _id: Types.ObjectId })._id)),
    );

    const lessonsByChapter = new Map<string, ContentTreeLessonItem[]>();

    for (const raw of lessons) {
      const l = raw as Lesson & { _id: Types.ObjectId };
      const chKey = String(l.chapterId);
      const arr = lessonsByChapter.get(chKey) || [];
      arr.push(this.mapLessonTreeItem(l, canTreeLessons));
      lessonsByChapter.set(chKey, arr);
    }

    let tree = chapters.map((c) => {
      const ch = c as { _id: Types.ObjectId; title: string; index: number };
      return {
        id: String(ch._id),
        title: ch.title,
        index: ch.index,
        lessons: lessonsByChapter.get(String(ch._id)) || [],
      };
    });

    const orphanLessons = lessons.filter(
      (raw) => !chapterIdSet.has(String((raw as Lesson).chapterId)),
    ) as (Lesson & { _id: Types.ObjectId })[];

    if (tree.length === 0 && lessons.length > 0) {
      tree = [
        {
          id: '__course_content__',
          title: 'Course content',
          index: 0,
          lessons: lessons.map((raw) =>
            this.mapLessonTreeItem(
              raw as Lesson & { _id: Types.ObjectId },
              canTreeLessons,
            ),
          ),
        },
      ];
    } else if (orphanLessons.length > 0) {
      const lastIndex =
        tree.length > 0 ? Math.max(...tree.map((t) => t.index)) : 0;
      tree.push({
        id: '__orphan_lessons__',
        title: 'Additional lessons',
        index: lastIndex + 1000,
        lessons: orphanLessons.map((l) =>
          this.mapLessonTreeItem(l, canTreeLessons),
        ),
      });
    }

    const totalLessons = lessons.length;
    const durationMinutes = lessons.reduce(
      (acc, l) => acc + ((l as Lesson).durationMinutes || 0),
      0,
    );

    const lockedTree = await this.applySequentialLocksToTree(
      tree,
      courseIdStr,
      userId,
      canContent,
      isOwner,
    );

    return {
      course: { id: String(course._id), title: course.title },
      enrolled,
      totalLessons,
      durationMinutes,
      chapters: lockedTree,
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
        this.bookModel
          .find({ _id: { $in: ids } })
          .select('title')
          .lean(),
        this.guideModel
          .find({ _id: { $in: ids } })
          .select('title')
          .lean(),
        this.presentationModel
          .find({ _id: { $in: ids } })
          .select('title')
          .lean(),
      ]);
      const meta = new Map<
        string,
        { title: string; materialType: 'book' | 'guide' | 'presentation' }
      >();
      for (const b of books) {
        meta.set(String(b._id), {
          title: String(b.title),
          materialType: 'book',
        });
      }
      for (const g of guides) {
        meta.set(String(g._id), {
          title: String(g.title),
          materialType: 'guide',
        });
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
        if (title) quizzes.push({ id, title, kind: 'quiz' });
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
          String(
            p.title ||
              (p as { functionName?: string }).functionName ||
              'Problem',
          ),
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
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) {
      throw new NotFoundException('Course not found');
    }
    const courseOid = new Types.ObjectId(courseIdStr);

    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      ...this.matchCourseId(courseOid, courseIdStr),
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = await this.courseModel
      .findById(courseOid)
      .select('ownerId')
      .lean();
    const isOwner = this.sameActorId(
      (course as { ownerId?: unknown } | null)?.ownerId,
      userId,
    );
    const canAccess =
      (await this.enrollService.canAccessCourseContent(userId, courseIdStr)) ||
      isOwner;

    if (!lesson.previewable && !canAccess) {
      throw new ForbiddenException(
        'You must enroll in this course to view this lesson',
      );
    }

    if (!isOwner) {
      const lessonAccess = await this.enrollService.getLessonAccess(
        courseIdStr,
        String(lessonId),
        userId,
      );
      if (!lessonAccess.access) {
        throw new ForbiddenException(
          lessonAccess.reason === 'locked'
            ? 'Complete the previous lesson first.'
            : 'This lesson is not accessible yet.',
        );
      }
    }

    this.logger.log(
      `[COURSE_PREVIEW_ACCESS] courseId=${courseIdStr} lessonId=${String(lessonId)} userId=${String(userId)} isOwner=${isOwner} previewable=${!!lesson.previewable} canAccess=${canAccess}`,
    );

    const access = { access: true, reason: canAccess ? 'allowed' : 'preview' };

    const legacyUrl = lesson.videoUrl?.trim();
    const videoKeyRaw = lesson.videoObjectKey?.trim() ?? '';
    if (legacyUrl && !videoKeyRaw) {
      this.logger.warn(
        `Legacy video detected: videoUrl without videoObjectKey lessonId=${lessonId} courseId=${courseIdStr}`,
      );
    }

    let streamUrl: string | null = null;
    let videoError = false;
    if (videoKeyRaw && objectKeyFromStoredValue(videoKeyRaw)) {
      streamUrl = buildStableMediaPath(
        `/lms/courses/${encodeURIComponent(courseIdStr)}/lessons/${encodeURIComponent(String(lesson._id))}/video`,
      );
    } else if (videoKeyRaw) {
      videoError = true;
    }

    let posterUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (lesson.thumbnailKey) {
      const tk = objectKeyFromStoredValue(lesson.thumbnailKey);
      if (tk) {
        posterUrl = buildStableLmsLessonPosterUrl(
          courseIdStr,
          String(lesson._id),
        );
        thumbnailUrl = posterUrl;
      }
    }

    const video = {
      streamUrl,
      videoObjectKey: videoKeyRaw || null,
      videoError,
      ...(posterUrl ? { posterUrl, thumbnailUrl } : {}),
    };

    const resources = await this.buildLessonResources(lesson);

    const { requiredSheetIds, completedSheetIds } =
      await this.getLessonSheetRequirements(
        new Types.ObjectId(lessonId),
        userId,
      );
    const requiredQuizIds: string[] = [];
    const requiredMaterialIds: string[] = [];
    let lessonCompleted = false;
    let watchedPercentage = 0;
    if (userId && Types.ObjectId.isValid(userId)) {
      const userOid = new Types.ObjectId(userId);
      const lp = await this.lessonProgressModel
        .findOne({
          ...this.matchCourseId(courseOid, courseIdStr),
          ...this.matchUserId(userOid, userId),
          lessonId,
        })
        .select('completed watchedPercentage')
        .lean();
      lessonCompleted = !!lp?.completed;
      watchedPercentage = lp?.watchedPercentage ?? 0;
    }
    const progression = this.progressionEngine.evaluateLessonCompletion({
      watchedPercentage,
      completed: lessonCompleted,
      hasVideo: !!videoKeyRaw,
      accessible: access.access,
      locked: !access.access,
      requiredSheetIds,
      completedSheetIds,
      requiredQuizIds,
      requiredMaterialIds,
    });

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
        watchedPercentage: progression.watchedPercentage,
        canMarkComplete: progression.canMarkComplete,
        watchThreshold: progression.watchThreshold,
        hasVideo: progression.hasVideo,
        completed: progression.completed,
        accessible: progression.accessible,
        locked: progression.locked,
        computedCompletionRequirements:
          progression.computedCompletionRequirements,
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
        throw new BadRequestException(
          'contentId must match courseId for course uploads',
        );
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

  /**
   * Authorize the same way as getLessonContent, then return the object key for gateway streaming.
   */
  async getLessonPosterStreamMeta(
    courseId: string,
    lessonId: string,
    userId: string,
  ): Promise<LessonVideoStreamMetaResult> {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) {
      return { error: 'not_found', message: 'Course not found' };
    }
    const courseOid = new Types.ObjectId(courseIdStr);

    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      ...this.matchCourseId(courseOid, courseIdStr),
    });
    if (!lesson) {
      return { error: 'not_found', message: 'Lesson not found' };
    }

    const course = await this.courseModel
      .findById(courseOid)
      .select('ownerId')
      .lean();
    const isOwner = this.sameActorId(
      (course as { ownerId?: unknown } | null)?.ownerId,
      userId,
    );
    const canAccess =
      (await this.enrollService.canAccessCourseContent(userId, courseIdStr)) ||
      isOwner;

    if (!lesson.previewable && !canAccess) {
      return { error: 'forbidden', message: 'Not allowed to view this lesson' };
    }

    if (!lesson.thumbnailKey) {
      return { error: 'no_video', message: 'No poster' };
    }
    const nk = objectKeyFromStoredValue(lesson.thumbnailKey);
    if (!nk) {
      return { error: 'no_video', message: 'No poster key' };
    }
    return {
      error: null,
      objectKey: nk,
      contentType: 'image/jpeg',
    };
  }

  /**
   * Authorize the same way as getLessonContent, then return the object key for gateway streaming.
   */
  async getLessonVideoStreamMeta(
    courseId: string,
    lessonId: string,
    userId: string,
  ): Promise<LessonVideoStreamMetaResult> {
    const courseIdStr = String(courseId ?? '').trim();
    if (!Types.ObjectId.isValid(courseIdStr)) {
      return { error: 'not_found', message: 'Course not found' };
    }
    const courseOid = new Types.ObjectId(courseIdStr);

    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      ...this.matchCourseId(courseOid, courseIdStr),
    });
    if (!lesson) {
      return { error: 'not_found', message: 'Lesson not found' };
    }

    const course = await this.courseModel
      .findById(courseOid)
      .select('ownerId')
      .lean();
    const isOwner = this.sameActorId(
      (course as { ownerId?: unknown } | null)?.ownerId,
      userId,
    );
    const canAccess =
      (await this.enrollService.canAccessCourseContent(userId, courseIdStr)) ||
      isOwner;

    if (!lesson.previewable && !canAccess) {
      return { error: 'forbidden', message: 'Not allowed to view this lesson' };
    }

    const videoKeyRaw = lesson.videoObjectKey?.trim() ?? '';
    const nk = objectKeyFromStoredValue(videoKeyRaw);
    if (!nk) {
      return { error: 'no_video', message: 'No video object key' };
    }

    return {
      error: null,
      objectKey: nk,
      contentType: 'video/mp4',
    };
  }
}
