import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from './schema/chapter.schema';
import { Course, CourseDocument } from '../course/schema/course.schema';

@Injectable()
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
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

    const totalPages = Math.ceil(totalChapters / limit);

    return {
      chapters,
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

    return chapter;
  }
}
