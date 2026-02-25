import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCourseDto, UpdateCourseDto, PublishCourseDto } from './dto/course.dto';
import { Course, CourseDocument } from './schema/course.schema';
import { Chapter, ChapterDocument } from '../chapter/schema/chapter.schema';
import { Lesson, LessonDocument } from '../lesson/schema/lesson.schema';


@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>
) {}

async createCourse(dto: CreateCourseDto, ownerId: string) {
  const courseData = {
    ...dto,
    ownerId,
    price: dto.price ?? { amount: 0, currency: 'USD', isFree: true },
  };
  const course = await this.courseModel.create(courseData);
  return { message: "Course created successfully", course };
}


async updateCourse(courseId: string, dto: UpdateCourseDto, ownerId: string) {
  const course = await this.courseModel.findById(courseId);
  if (!course) throw new NotFoundException('Course not found');
  if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');
  Object.keys(dto).forEach(key => {
    const value = dto[key as keyof UpdateCourseDto];
    if (value !== undefined) {
      (course as any)[key] = value;
    }
  });

  await course.save();
  return { message: "course updated successfully", course };
}


  async publishCourse(courseId: string, dto: PublishCourseDto, ownerId: string) {
    const course = await this.courseModel.findOne({ _id: courseId, ownerId });
    if (!course) throw new NotFoundException('Course not found or not owned by user');
    course.status = dto.status;
    await course.save();
      return{message : "course published successfully" , course};
  }

  async deleteCourse(courseId: string, ownerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');
    await course.deleteOne()
      return{message : "course deleted successfully" };
  }

  async computeCourseAggregates(courseId: string) {
    const chapters = await this.chapterModel.find({ courseId });
    const lessons = await this.lessonModel.find({ courseId });
    const totalLessons = lessons.length;
    const durationMinutes = lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    await this.courseModel.findByIdAndUpdate(courseId, { totalLessons, durationMinutes });
    return { totalLessons, durationMinutes, chapters: chapters.length };
  }

  async getAllCourses(query: { q?: string; categoryId?: string; status?: string; page?: number; limit?: number }) {
    const { q, categoryId, status, page = 1, limit = 12 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;
    if (q) filter.$text = { $search: q };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.courseModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.courseModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  async getCourseBySlug(slug: string) {
    const course = await this.courseModel.findOne({ slug });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async getCourseById(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  
}
