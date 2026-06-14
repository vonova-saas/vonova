/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Connection, Model, Types } from 'mongoose';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';
import { Course, CourseDocument } from './schema/course.schema';
import { Chapter, ChapterDocument } from '../chapter/schema/chapter.schema';
import { Lesson, LessonDocument } from '../lesson/schema/lesson.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enroll/schema/enrollment.schema';
import { S3Service } from '../../common/utils/storage/s3.service';
import { Asset, AssetDocument } from '../content/schema/asset.schema';
import { Book, BookDocument } from '../../library/schema/book/book.schema';
import { Guide, GuideDocument } from '../../library/schema/guide.schema';
import {
  Presentation,
  PresentationDocument,
} from '../../library/schema/presentation.schema';
import {
  LibraryAsset,
  LibraryAssetDocument,
} from '../../library/schema/library-asset.schema';
import { Quiz, QuizDocument } from '../../quiz/schema/quiz.schema';
import { objectKeyFromStoredValue } from '../../common/utils/s3-key.util';

export type CourseThumbnailStreamMetaResult =
  | { error: null; objectKey: string; contentType: string }
  | {
      error: 'not_found' | 'forbidden' | 'no_thumbnail';
      message?: string;
    };

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Guide.name) private guideModel: Model<GuideDocument>,
    @InjectModel(Presentation.name)
    private presentationModel: Model<PresentationDocument>,
    @InjectModel(LibraryAsset.name)
    private libraryAssetModel: Model<LibraryAssetDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    private readonly s3Service: S3Service,
    @InjectConnection() private readonly connection: Connection,
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  private readonly eventLogger = new Logger('CourseEvents');

  /**
   * Resolve { ownerId -> name } for a set of course owners.
   *
   * Users live in a separate database (`app`) on the same MongoDB cluster, so
   * we can't use Mongoose populate (the `User` model isn't registered on the
   * LMS connection). Instead, we re-use the existing connection via `useDb`
   * and read the raw `users` collection.
   *
   * The user-DB name is read from `USER_DB_NAME_FROM_LMS` (fallback `'app'`).
   * Returns an empty map if anything fails — owner name is best-effort UX
   * sugar and must never break a course payload.
   */
  private async resolveOwnerNames(
    ownerIds: Array<string | Types.ObjectId | null | undefined>,
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    const uniqueIds: Types.ObjectId[] = [];
    const seen = new Set<string>();
    for (const raw of ownerIds) {
      if (!raw) continue;
      try {
        const oid =
          raw instanceof Types.ObjectId
            ? raw
            : new Types.ObjectId(String(raw));
        const key = oid.toHexString();
        if (seen.has(key)) continue;
        seen.add(key);
        uniqueIds.push(oid);
      } catch {
        // ignore invalid ObjectIds
      }
    }
    if (uniqueIds.length === 0) return out;

    try {
      const userDbName = process.env.USER_DB_NAME_FROM_LMS ?? 'app';
      const users = await this.connection
        .useDb(userDbName, { useCache: true })
        .collection('users')
        .find(
          { _id: { $in: uniqueIds } },
          { projection: { _id: 1, name: 1 } },
        )
        .toArray();
      for (const u of users) {
        const id = (u as { _id?: unknown })._id;
        const name = (u as { name?: unknown }).name;
        if (id && typeof name === 'string' && name.trim().length > 0) {
          out.set(String(id), name);
        }
      }
    } catch (err) {
      // Best-effort: swallow lookup failures so a User DB hiccup never
      // breaks course listings.
      console.warn('[CourseService] resolveOwnerNames failed:', err);
    }
    return out;
  }

  private logS3Delete(payload: Record<string, unknown>) {
    console.log('[S3 DELETE]', payload);
  }

  /**
   * Remove S3 objects and library file assets tied to this course (lessons, uploads, materials).
   */
  async deepDeleteCourseAssets(courseId: string): Promise<void> {
    const oid = new Types.ObjectId(courseId);

    const lessons = await this.lessonModel.find({ courseId: oid }).lean();
    for (const l of lessons) {
      const lessonId = String(l._id);
      const vk = (l as { videoObjectKey?: string }).videoObjectKey;
      if (vk) {
        const ok = await this.s3Service.deleteFileFromS3(vk);
        this.logS3Delete({
          courseId,
          lessonId,
          assetKey: vk,
          phase: 'lesson_video',
          success: ok,
        });
      }
    }

    const assets = await this.assetModel.find({ courseId: oid }).lean();
    for (const a of assets) {
      if (a.objectKey) {
        const ok = await this.s3Service.deleteFileFromS3(a.objectKey);
        this.logS3Delete({
          courseId,
          lessonId: String(a.lessonId),
          assetKey: a.objectKey,
          phase: 'content_asset',
          success: ok,
        });
      }
    }
    await this.assetModel.deleteMany({ courseId: oid });

    const clearLibraryItem = async (
      doc: { _id: unknown; fileAssetId?: Types.ObjectId | null },
      materialType: string,
    ) => {
      const mid = String(doc._id);
      if (!doc.fileAssetId) return;
      const la = await this.libraryAssetModel.findById(doc.fileAssetId).lean();
      if (la?.objectKey) {
        const ok = await this.s3Service.deleteFileFromS3(la.objectKey);
        this.logS3Delete({
          courseId,
          materialId: mid,
          materialType,
          assetKey: la.objectKey,
          phase: 'library_material',
          success: ok,
        });
      }
      await this.libraryAssetModel.deleteOne({ _id: doc.fileAssetId });
    };

    const books = await this.bookModel.find({ courseId: oid }).lean();
    for (const b of books) await clearLibraryItem(b, 'book');
    const guides = await this.guideModel.find({ courseId: oid }).lean();
    for (const g of guides) await clearLibraryItem(g, 'guide');
    const pres = await this.presentationModel.find({ courseId: oid }).lean();
    for (const p of pres) await clearLibraryItem(p, 'presentation');

    await this.bookModel.deleteMany({ courseId: oid });
    await this.guideModel.deleteMany({ courseId: oid });
    await this.presentationModel.deleteMany({ courseId: oid });
  }

  async createCourse(dto: CreateCourseDto, createdBy: string) {
    const courseData = {
      ...dto,
      price: dto.price ?? { amount: 0, currency: 'USD', isFree: true },
      ownerId: createdBy,
    };
    const course = await this.courseModel.create(courseData);

    try {
      this.natsClient.emit('app.events.course.created', {
        courseId: String(course._id),
        instructorId: String(createdBy),
        title: course.title,
        description: (course as { description?: string }).description ?? '',
      });
      this.eventLogger.log(
        `Emitted app.events.course.created courseId=${String(course._id)}`,
      );
    } catch (err) {
      this.eventLogger.warn(
        `Failed to emit course.created event: ${(err as Error).message}`,
      );
    }

    return {
      message: 'Course created successfully',
      data: course.toObject({ flattenMaps: true }),
    };
  }

  /**
   * Called by the API gateway after `CommunityGroup` is created so LMS can
   * store the back-reference. Owner-only.
   */
  async setCommunityGroupId(
    courseId: string,
    ownerId: string,
    communityGroupId: string,
  ) {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Course not found');
    }
    if (!Types.ObjectId.isValid(communityGroupId)) {
      throw new BadRequestException('Invalid communityGroupId');
    }
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('Not owner of course');
    }
    course.set('communityGroupId', new Types.ObjectId(communityGroupId));
    await course.save();
    this.eventLogger.log(
      `[COURSE_GROUP_VERIFY] courseId=${courseId} ownerId=${ownerId} communityGroupId=${communityGroupId} linked=true`,
    );
    return {
      message: 'Community group linked',
      data: course.toObject({ flattenMaps: true }),
    };
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.ownerId.toString() !== ownerId)
      throw new ForbiddenException('Not owner of course');
    Object.keys(dto).forEach((key) => {
      const value = dto[key as keyof UpdateCourseDto];
      if (value !== undefined) {
        (course as any)[key] = value;
      }
    });

    await course.save();
    return {
      message: 'course updated successfully',
      data: course.toObject({ flattenMaps: true }),
    };
  }

  async publishCourse(
    courseId: string,
    dto: PublishCourseDto,
    ownerId: string,
  ) {
    const course = await this.courseModel.findOne({ _id: courseId, ownerId });
    if (!course)
      throw new NotFoundException('Course not found or not owned by user');
    course.status = dto.status;
    if (dto.status === 'PUBLISHED' && !course.publishedAt) {
      course.publishedAt = new Date();
    }
    await course.save();
    return {
      message: 'course published successfully',
      data: course.toObject({ flattenMaps: true }),
    };
  }

  private extractCourseThumbKey(
    thumbnailUrl?: string,
    thumbnailKey?: string,
  ): string | null {
    if (thumbnailKey && typeof thumbnailKey === 'string' && thumbnailKey.trim()) {
      return thumbnailKey.trim();
    }
    if (!thumbnailUrl || typeof thumbnailUrl !== 'string') return null;
    try {
      const u = new URL(thumbnailUrl);
      const host = u.hostname.toLowerCase();
      if (!host.includes('amazonaws.com')) return null;
      const vh = /^([^.]+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i;
      if (vh.test(host)) {
        const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
        return key || null;
      }
      if (
        host === 's3.amazonaws.com' ||
        /^s3\.[a-z0-9-]+\.amazonaws\.com$/i.test(host)
      ) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return decodeURIComponent(parts.slice(1).join('/'));
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Resolve thumbnail object key for stable gateway streaming.
   */
  async getCourseThumbnailStreamMeta(
    courseId: string,
    userId?: string,
  ): Promise<CourseThumbnailStreamMetaResult> {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) {
      return { error: 'not_found', message: 'Course not found' };
    }
    const status = (course as { status?: string }).status;
    const ownerId = String((course as { ownerId?: unknown }).ownerId ?? '');
    const isOwner = userId && ownerId && String(userId) === ownerId;
    if (status !== 'PUBLISHED' && !isOwner) {
      return { error: 'forbidden', message: 'Course not available' };
    }
    const rawKey = this.extractCourseThumbKey(
      (course as { thumbnailUrl?: string }).thumbnailUrl,
      (course as { thumbnailKey?: string }).thumbnailKey,
    );
    const nk = rawKey ? objectKeyFromStoredValue(rawKey) : null;
    if (!nk) {
      return { error: 'no_thumbnail', message: 'No thumbnail' };
    }
    return {
      error: null,
      objectKey: nk,
      contentType: 'image/jpeg',
    };
  }

  async deleteCourse(courseId: string, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.ownerId.toString() !== ownerId)
      throw new ForbiddenException('Not owner of course');

    const courseIdStr = String(course._id);
    const communityGroupIdStr = course.communityGroupId
      ? String(course.communityGroupId)
      : '';

    const thumbKey = this.extractCourseThumbKey(
      course.thumbnailUrl,
      course.thumbnailKey,
    );
    if (thumbKey) {
      const ok = await this.s3Service.deleteFileFromS3(thumbKey);
      this.logS3Delete({
        courseId,
        assetKey: thumbKey,
        phase: 'course_thumbnail',
        success: ok,
      });
    }

    await this.deepDeleteCourseAssets(courseId);

    const oid = new Types.ObjectId(courseId);
    await this.enrollmentModel.deleteMany({ courseId: oid });
    await this.quizModel.deleteMany({ courseId: oid });
    await this.lessonModel.deleteMany({ courseId: oid });
    await this.chapterModel.deleteMany({ courseId: oid });

    await course.deleteOne();

    try {
      this.natsClient.emit('app.events.course.deleted', {
        courseId: courseIdStr,
        ownerId: String(ownerId),
        ...(communityGroupIdStr ? { communityGroupId: communityGroupIdStr } : {}),
      });
      this.eventLogger.log(
        `[COURSE_DELETE_SYNC] emitted app.events.course.deleted courseId=${courseIdStr} ownerId=${ownerId} communityGroupId=${communityGroupIdStr || 'none'}`,
      );
    } catch (err) {
      this.eventLogger.warn(
        `[COURSE_DELETE_SYNC] failed to emit course.deleted (retry via gateway RPC or orphan repair script): ${(err as Error).message}`,
      );
    }

    return {
      success: true,
      message: 'course deleted successfully',
      data: { courseId },
    };
  }

  async computeCourseAggregates(courseId: string) {
    const chapters = await this.chapterModel.find({ courseId });
    const lessons = await this.lessonModel.find({ courseId });
    const totalLessons = lessons.length;
    const durationMinutes = lessons.reduce(
      (acc, l) => acc + (l.durationMinutes || 0),
      0,
    );
    await this.courseModel.findByIdAndUpdate(courseId, {
      totalLessons,
      durationMinutes,
    });
    return { totalLessons, durationMinutes, chapters: chapters.length };
  }

  async getAllCourses(query: {
    q?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    isFree?: string | boolean;
    instructorId?: string;
    ownerId?: string;
    catalogUserId?: string;
    applyCatalog?: boolean | string;
  }) {
    const {
      q,
      search,
      status,
      page = 1,
      limit = 12,
      category,
      level,
      isFree,
      instructorId,
      ownerId,
      catalogUserId,
      applyCatalog = true,
    } = query;

    const useCatalog =
      applyCatalog === true ||
      applyCatalog === 'true' ||
      String(applyCatalog) === 'true';

    const filter: Record<string, unknown> = {};
    const owner = instructorId || ownerId;

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (owner) filter.ownerId = owner;

    const free =
      isFree === true ||
      isFree === 'true' ||
      String(isFree).toLowerCase() === 'true';
    if (free) {
      (filter as any)['price.isFree'] = true;
    }
    const searchTerm = q || search;

    if (useCatalog) {
      const enrolledCourseIds = catalogUserId
        ? await this.enrollmentModel
            .find({
              userId: catalogUserId,
              status: { $in: ['ACTIVE', 'COMPLETED'] },
            })
            .distinct('courseId')
        : [];
      const oids = enrolledCourseIds.map((id) =>
        id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id)),
      );
      const clause: Record<string, unknown> = {
        status: 'PUBLISHED',
        $or: [
          { visibility: { $ne: 'PRIVATE' } },
          ...(oids.length > 0 ? [{ _id: { $in: oids } }] : []),
        ],
      };
      if (searchTerm) {
        filter.$and = [{ $text: { $search: searchTerm } }, clause];
      } else {
        Object.assign(filter, clause);
      }
    } else if (status) {
      filter.status = status;
      if (searchTerm) {
        filter.$text = { $search: searchTerm };
      }
    } else if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    const skip = (page - 1) * limit;
    const [rawItems, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.courseModel.countDocuments(filter),
    ]);

    const owners = await this.resolveOwnerNames(
      rawItems.map(
        (doc) =>
          (doc as { ownerId?: unknown }).ownerId as
            | string
            | Types.ObjectId
            | undefined,
      ),
    );
    const items = rawItems.map((doc) => {
      const ownerKey = String((doc as { ownerId?: unknown }).ownerId ?? '');
      const name = owners.get(ownerKey);
      if (name) (doc as Record<string, unknown>).ownerName = name;
      return doc;
    });

    const totalPages = Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  /** Normalize ObjectId / lean / $oid shapes for stable string comparison. */
  private normalizeMongoId(value: unknown): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string') {
      const s = value.trim();
      return s.length > 0 ? s : undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      '$oid' in (value as object)
    ) {
      const oid = (value as { $oid?: unknown }).$oid;
      if (oid != null) return String(oid).trim();
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { toString?: () => string }).toString === 'function'
    ) {
      const s = (value as { toString: () => string }).toString().trim();
      if (s && s !== '[object Object]') return s;
    }
    return undefined;
  }

  async getCourseDetails(courseId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('Course not found');

    const courseObjectId = course._id;
    const [chaptersCount, lessonsCount, quizzesCount] = await Promise.all([
      this.chapterModel.countDocuments({ courseId: courseObjectId }),
      this.lessonModel.countDocuments({ courseId: courseObjectId }),
      this.lessonModel.countDocuments({
        courseId: courseObjectId,
        quizId: { $exists: true, $ne: null },
      }),
    ]);

    const materialsCount = await this.lessonModel.aggregate([
      { $match: { courseId: courseObjectId } },
      { $project: { n: { $size: { $ifNull: ['$materials', []] } } } },
      { $group: { _id: null, total: { $sum: '$n' } } },
    ]);
    const problemsCount = await this.lessonModel.aggregate([
      { $match: { courseId: courseObjectId } },
      { $project: { n: { $size: { $ifNull: ['$problems', []] } } } },
      { $group: { _id: null, total: { $sum: '$n' } } },
    ]);

    return {
      course,
      chaptersCount,
      lessonsCount,
      materialsCount: materialsCount[0]?.total ?? 0,
      quizzesCount,
      problemsCount: problemsCount[0]?.total ?? 0,
    };
  }

  private async assertCanViewCourse(
    course: {
      _id: unknown;
      ownerId: unknown;
      status?: string;
      visibility?: string;
    },
    requesterId?: string,
  ) {
    let rawOwner: unknown = course.ownerId;
    if (
      rawOwner &&
      typeof rawOwner === 'object' &&
      !('$oid' in (rawOwner as object)) &&
      '_id' in (rawOwner as object)
    ) {
      rawOwner = (rawOwner as { _id: unknown })._id;
    }
    const owner = this.normalizeMongoId(rawOwner);
    const rid = this.normalizeMongoId(requesterId);
    if (rid && owner && rid === owner) return;
    if (course.status !== 'PUBLISHED') {
      throw new ForbiddenException('Course is not available');
    }
    const vis = course.visibility ?? 'PUBLIC';
    if (vis !== 'PRIVATE') return;
    if (!rid) {
      throw new ForbiddenException('You must enroll in this course first');
    }
    const enrolled = await this.enrollmentModel.exists({
      courseId: course._id,
      userId: rid,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });
    if (!enrolled) {
      throw new ForbiddenException('You must enroll in this course first');
    }
  }

  async getCourseBySlug(slug: string, requesterId?: string) {
    const course = await this.courseModel.findOne({ slug }).lean();
    if (!course) throw new NotFoundException('Course not found');
    await this.assertCanViewCourse(course, requesterId);
    return course;
  }

  async getCourseById(courseId: string, requesterId?: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('Course not found');
    await this.assertCanViewCourse(course, requesterId);

    const rid = this.normalizeMongoId(requesterId);
    const own = this.normalizeMongoId(
      (course as { ownerId?: unknown }).ownerId,
    );
    this.eventLogger.log(
      `[COURSE_PREVIEW_ACCESS] courseId=${courseId} requesterId=${rid ?? 'anonymous'} isOwner=${!!(rid && own && rid === own)} status=${String((course as { status?: string }).status ?? '')}`,
    );

    const owners = await this.resolveOwnerNames([
      (course as { ownerId?: unknown }).ownerId as
        | string
        | Types.ObjectId
        | undefined,
    ]);
    const ownerKey = String((course as { ownerId?: unknown }).ownerId ?? '');
    const name = owners.get(ownerKey);
    if (name) (course as Record<string, unknown>).ownerName = name;

    return course;
  }

  async getMyCourses(ownerId: string) {
    const filter = { ownerId };
    const [items, total] = await Promise.all([
      this.courseModel.find(filter).sort({ createdAt: -1 }).lean(),
      this.courseModel.countDocuments(filter),
    ]);
    return {
      items,
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }
}
