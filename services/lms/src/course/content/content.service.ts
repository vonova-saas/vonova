import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Asset } from 'src/schemas/course/asset.schema';
import { Chapter } from 'src/schemas/course/chapter.schema';
import { Course } from 'src/schemas/course/course.schema';
import { Lesson } from 'src/schemas/course/lesson.schema';
import { S3Service } from 'src/utils/storage/s3.service';


@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Chapter.name) private chapterModel: Model<Chapter>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    private s3Service: S3Service,
  ) {}

  async getCourseContentTree(courseId: string, userId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const [chapters, lessons] = await Promise.all([
      this.chapterModel.find({ courseId }).sort({ index: 1 }),
      this.lessonModel.find({ courseId }).sort({ chapterId: 1, index: 1 }),
    ]);

    const enrolled = false;

    const lessonsByChapter = new Map<string, any[]>();

    for (const l of lessons) {
      const accessible = l.previewable || enrolled;
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

  async getLessonContent(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.lessonModel.findOne({
      _id: lessonId,
      courseId,
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const access = { access: true, reason: 'TEMP' };

    let video: { streamUrl?: string; posterUrl?: string } | undefined = undefined;

    if (lesson.type === 'VIDEO' && lesson.videoAssetId) {
      const asset = await this.assetModel.findById(lesson.videoAssetId);

      if (asset && asset.status !== 'FAILED') {
        const streamUrl = asset.objectKey
          ? await this.s3Service.getPresignedGetUrl(asset.objectKey)
          : asset.urls.streamUrl;

        video = {
          streamUrl,
          posterUrl: asset.urls.posterUrl,
        };
      }
    }

    return {
      access: true,
      reason: access.reason,
      lesson: {
        id: String(lesson._id),
        title: lesson.title,
        type: lesson.type,
        durationMinutes: lesson.durationMinutes || 0,
        content: lesson.type === 'ARTICLE' ? lesson.content : undefined,
        video,
      },
    };
  }
}
