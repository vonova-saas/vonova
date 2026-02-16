import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from 'src/schemas/course/chapter.schema';
import { Course, CourseDocument } from 'src/schemas/course/course.schema';


@Injectable()
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async createChapter(courseId: string, dto: { title: string; index?: number }) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    return this.chapterModel.create({
      courseId,
      title: dto.title,
      index: dto.index ?? 0,
    });
  }

  async updateChapter(
    courseId: string,
    chapterId: string,
    dto: { title?: string; index?: number },
  ) {
    
    const chapter = await this.chapterModel.findOne({
      _id: new Types.ObjectId(chapterId),
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    Object.assign(chapter, dto);
    await chapter.save();

    return {message: 'Chapter updated successfully' , chapter };
  }

  async reorderChapters(
    courseId: string,
    order: Array<{ chapterId: string; index: number }>,
  ) {
    const ops = order.map((o) =>
      this.chapterModel.updateOne(
        { _id: o.chapterId, courseId },
        { $set: { index: o.index } },
      ),
    );

    await Promise.all(ops);
    return { success: true };
  }

  async deleteChapter(courseId: string, chapterId: string) {
    const chapter = await this.chapterModel.findOne({
      _id: chapterId,
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    await chapter.deleteOne();
    return {message: 'Chapter deleted successfully' };
  }
}

