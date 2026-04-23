import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../chapter/schema/chapter.schema';
import { Course, CourseDocument } from '../course/schema/course.schema';
import { Lesson, LessonDocument } from './schema/lesson.schema';
import { Asset, AssetDocument } from '../content/schema/asset.schema';
import {
  CreateLessonDto,
  ReorderLessonDto,
  UpdateLessonDto,
} from './dto/lesson.dto';
import { S3ConfigService } from './config/s3.config';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as multer from 'multer';
import { Readable } from 'stream';

@Injectable()
export class LessonService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    private readonly s3ConfigService: S3ConfigService,
  ) {}

  async createLesson(
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId,
    dto: CreateLessonDto,
    ownerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const chapter = await this.chapterModel.findOne({ _id: chapterId });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const lesson = await this.lessonModel.create({
      courseId,
      chapterId,
      createdBy: ownerId,
      ...dto,
    });
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
    // if (course.ownerId.toString() !== ownerId) throw new ForbiddenException('Not owner of course');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    Object.assign(lesson, dto);
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

  async uploadVideoDirectly(
    courseId: string,
    lessonId: string,
    videoMetadata: {
      objectKey: string;
      videoUrl: string;
      hasVideo: boolean;
      size: number;
      mimetype: string;
      originalName: string;
    },
    ownerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Update lesson with video information
    lesson.videoObjectKey = videoMetadata.objectKey;
    lesson.videoUrl = videoMetadata.videoUrl;
    lesson.hasVideo = videoMetadata.hasVideo;
    await lesson.save();

    return {
      message: 'Video metadata updated successfully',
      lesson: {
        ...lesson.toObject(),
        videoUrl: videoMetadata.videoUrl,
      },
    };
  }

  async getVideoUploadUrl(
    courseId: string,
    lessonId: string,
    uploadData: {
      fileName: string;
      contentType: string;
      objectKey: string;
    },
    ownerId: string,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uploadData.objectKey,
      ContentType: uploadData.contentType,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // Update lesson with video object key (will be used when client confirms upload)
    lesson.videoObjectKey = uploadData.objectKey;
    lesson.hasVideo = true;
    await lesson.save();

    return {
      uploadUrl,
      objectKey: uploadData.objectKey,
    };
  }

  async getVideoUrl(objectKey: string) {
    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const videoUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { videoUrl };
  }

  async getPresignedUploadUrl(objectKey: string, contentType: string) {
    const bucketName = this.s3ConfigService.getBucketName();
    const s3Client = this.s3ConfigService.getClient();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return { uploadUrl };
  }

  async getLesson(lessonId: string, courseId: string) {
    const lesson = await this.lessonModel.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // If lesson has video, generate presigned URL
    let videoUrl = lesson.videoUrl;
    if (lesson.hasVideo && lesson.videoObjectKey) {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const command = new GetObjectCommand({
        Bucket: this.s3ConfigService.getBucketName(),
        Key: lesson.videoObjectKey,
      });
      videoUrl = await getSignedUrl(this.s3ConfigService.getClient(), command, {
        expiresIn: 3600,
      });
    }

    const lessonResponse = {
      ...lesson.toObject(),
      videoUrl,
      chapterId: lesson.chapterId, // Include chapterId in response
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
      urls: {
        sourceUrl: metadata.fileUrl,
      },
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
      fileUrl: metadata.fileUrl,
    };
  }
}
