import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../chapter/schema/chapter.schema';
import { Course, CourseDocument } from '../course/schema/course.schema';
import { Lesson, LessonDocument } from './schema/lesson.schema';
import { CreateLessonDto, ReorderLessonDto, UpdateLessonDto } from './dto/lesson.dto';



@Injectable()
export class LessonService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
  ) {}

  async createLesson(courseId: Types.ObjectId, chapterId: Types.ObjectId, dto: CreateLessonDto, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const chapter = await this.chapterModel.findOne({ _id: chapterId });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const lesson = await this.lessonModel.create({ courseId, chapterId, ...dto });
    return {message: 'Lesson created successfully', lesson};
  }

  async updateLesson(courseId: string, lessonId: string, dto: UpdateLessonDto, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    Object.assign(lesson, dto);
    await lesson.save();
    return {message: 'Lesson updated successfully', lesson};
  }

  async reorderLessons(courseId: string, dto: ReorderLessonDto, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const ops = dto.order.map(o =>
      this.lessonModel.updateOne({ _id: o.lessonId, courseId }, { $set: { index: o.index } })
    );
    await Promise.all(ops);
    return {message: 'Lessons reordered successfully'};
  }

  async deleteLesson(courseId: string, lessonId: string, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await lesson.deleteOne();
    return {message: 'Lesson deleted successfully', lesson};
  }
}
