import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from './schema/chapter.schema';
import { Course, CourseDocument } from '../course/schema/course.schema';
import { Lesson, LessonDocument } from '../lesson/schema/lesson.schema';

@Injectable()
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async createChapter(
    courseId: string,
    dto: { title: string; index?: number },
    createdBy: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    return this.chapterModel.create({
      courseId,
      title: dto.title,
      index: dto.index ?? 1,
      createdBy,
    });
  }

  async updateChapter(
    courseId: string,
    chapterId: string,
    dto: { title?: string; index?: number },
    userId: string,
  ) {
    // Validate ObjectIds before processing
    try {
      new Types.ObjectId(chapterId);
    } catch (error) {
      throw new Error(`Invalid chapterId format: ${chapterId}`);
    }

    const chapter = await this.chapterModel.findOne({
      _id: new Types.ObjectId(chapterId),
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    // Check if user is the course owner or chapter creator
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (
      course.ownerId.toString() !== userId &&
      chapter.createdBy.toString() !== userId
    )
      throw new NotFoundException('Chapter not found or no permission');

    Object.assign(chapter, dto);
    await chapter.save();

    return { message: 'Chapter updated successfully', chapter };
  }

  async reorderChapters(
    courseId: string,
    order: Array<{ chapterId: string; index: number }>,
    userId: string,
  ) {
    console.log('reorderChapters called with:', { courseId, order, userId });

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
      throw new ForbiddenException('Only course owner can reorder chapters');

    // Validate all chapterIds exist before processing
    const chapterIds = order.map((o) => o.chapterId);
    console.log('Looking for chapters with IDs:', chapterIds);

    const existingChapters = await this.chapterModel.find({
      _id: { $in: chapterIds },
      courseId,
    });

    if (existingChapters.length !== chapterIds.length) {
      const foundIds = existingChapters.map((c) => c._id.toString());
      const missingIds = chapterIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Chapters not found: ${missingIds.join(', ')}`,
      );
    }

    const ops = order.map((o) => {
      try {
        console.log('Processing chapter:', o);
        new Types.ObjectId(o.chapterId);
        return this.chapterModel.updateOne(
          { _id: new Types.ObjectId(o.chapterId), courseId },
          { $set: { index: o.index } },
        );
      } catch (error) {
        console.error('Invalid chapterId format:', o.chapterId);
        throw new Error(`Invalid chapterId format: ${o.chapterId}`);
      }
    });

    await Promise.all(ops);
    return { success: true };
  }

  async deleteChapter(courseId: string, chapterId: string, userId: string) {
    // Validate ObjectIds before processing
    try {
      new Types.ObjectId(chapterId);
    } catch (error) {
      throw new Error(`Invalid chapterId format: ${chapterId}`);
    }

    const chapter = await this.chapterModel.findOne({
      _id: new Types.ObjectId(chapterId),
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    // Check if user is the course owner or chapter creator
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (
      course.ownerId.toString() !== userId &&
      chapter.createdBy.toString() !== userId
    )
      throw new NotFoundException('Chapter not found or no permission');

    await chapter.deleteOne();
    return { message: 'Chapter deleted successfully' };
  }

  /**
   * Lesson documents are the source of truth for structure; chapter.lessons
   * refs may be empty on older rows because createLesson did not sync them.
   */
  private async attachLessonsToChapters(chapters: ChapterDocument[]) {
    const chapterIds = chapters.map((c) => c._id);
    const lessons =
      chapterIds.length === 0
        ? []
        : await this.lessonModel
            .find({ chapterId: { $in: chapterIds } })
            .sort({ index: 1, createdAt: 1 })
            .lean()
            .exec();

    const byChapter = new Map<string, unknown[]>();
    for (const l of lessons) {
      const cid = String(l.chapterId);
      const arr = byChapter.get(cid) ?? [];
      arr.push(l);
      byChapter.set(cid, arr);
    }

    return chapters.map((ch) => {
      const plain =
        typeof (ch as ChapterDocument).toObject === 'function'
          ? (ch as ChapterDocument).toObject()
          : { ...(ch as object) };
      return {
        ...plain,
        lessons: byChapter.get(String(ch._id)) ?? [],
      };
    });
  }

  async getAllChapters(
    courseId: string,
    pagination: { page?: number; limit?: number },
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Validate courseId
    try {
      new Types.ObjectId(courseId);
    } catch (error) {
      throw new Error(`Invalid courseId format: ${courseId}`);
    }

    // Check if course exists
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const totalChapters = await this.chapterModel.countDocuments({ courseId });
    const chapters = await this.chapterModel
      .find({ courseId })
      .sort({ index: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const chaptersWithLessons = await this.attachLessonsToChapters(chapters);

    const totalPages = Math.ceil(totalChapters / limit);

    return {
      chapters: chaptersWithLessons,
      currentPage: page,
      totalPages,
      totalChapters,
      limit,
    };
  }

  async getChapterById(courseId: string, chapterId: string) {
    // Validate ObjectIds before processing
    try {
      new Types.ObjectId(chapterId);
      new Types.ObjectId(courseId);
    } catch (error) {
      throw new Error(`Invalid ID format`);
    }

    const chapter = await this.chapterModel.findOne({
      _id: new Types.ObjectId(chapterId),
      courseId,
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    // Check if course exists
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const [withLessons] = await this.attachLessonsToChapters([chapter]);
    return withLessons;
  }
}
