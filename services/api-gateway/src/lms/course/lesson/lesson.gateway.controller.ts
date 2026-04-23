/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { LessonGatewayService } from './lesson.gateway.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
  VideoUploadUrlDto,
} from './dto/lesson.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@ApiTags('LMS Course Lessons')
@ApiBearerAuth()
@ApiTags('lessons')
@Controller('api/v1/lms/courses/:courseId/chapters/:chapterId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonGatewayController {
  constructor(private readonly lessonService: LessonGatewayService) {}

  private readonly s3Client = new S3Client({
    region: process.env.AWS_S3_REGION_LMS,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID_LMS!,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY_LMS!,
    },
  });

  @ApiOperation({
    summary: 'Create new lesson',
    description: 'Creates a new lesson within a specific chapter of a course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'The unique identifier of the chapter',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        chapterId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Introduction to JavaScript Variables',
        },
        index: { type: 'number', example: 0 },
        durationMinutes: { type: 'number', example: 45 },
        type: { type: 'string', example: 'VIDEO' },
        previewable: { type: 'boolean', example: true },
        content: { type: 'string', example: 'Lesson content here...' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid lesson data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or chapter not found',
  })
  @Post()
  async createLesson(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
    @Request() req: any,
  ) {
    console.log('Create lesson request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    console.log('Creating lesson with ownerId:', ownerId);
    return firstValueFrom(
      this.lessonService.createLesson(courseId, chapterId, dto, ownerId),
    );
  }

  @Patch('reorder')
  async reorderLessons(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonDto,
    @Request() req: any,
  ) {
    console.log('Reorder lessons request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    // Validate courseId format
    if (!/^[0-9a-fA-F]{24}$/.test(courseId)) {
      throw new Error(`Invalid courseId format: ${courseId}`);
    }

    console.log('Gateway reorder lessons payload:', { courseId, dto, ownerId });

    return firstValueFrom(
      this.lessonService.reorderLessons(courseId, dto, ownerId),
    );
  }

  @ApiOperation({
    summary: 'Update lesson',
    description:
      'Updates an existing lesson with new information within a specific chapter of a course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        chapterId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Introduction to JavaScript Variables',
        },
        index: { type: 'number', example: 0 },
        durationMinutes: { type: 'number', example: 45 },
        type: { type: 'string', example: 'VIDEO' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid lesson data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only course owner can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or lesson not found',
  })
  @Patch(':lessonId')
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: any,
  ) {
    console.log('Update lesson request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.lessonService.updateLesson(courseId, lessonId, dto, ownerId),
    );
  }

  @ApiOperation({
    summary: 'Delete lesson',
    description: 'Permanently deletes a lesson from a chapter within a course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Lesson deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only course owner can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or lesson not found',
  })
  @Delete(':lessonId')
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    console.log('Delete lesson request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.lessonService.deleteLesson(courseId, lessonId, ownerId),
    );
  }

  @ApiOperation({
    summary: 'Get presigned URL for video access',
    description:
      'Generates a presigned S3 URL for accessing a video. Use this to get a temporary URL that works for 1 hour.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'The unique identifier of the chapter',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          example: 'https://your-bucket.s3.amazonaws.com/videos/...',
          description: 'Presigned URL for video access (expires in 1 hour)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing objectKey',
  })
  @Post(':chapterId/:lessonId/video/url')
  async getVideoUrl(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: VideoUploadUrlDto,
    @Request() req: any,
  ) {
    if (!body.objectKey) {
      throw new Error('objectKey is required');
    }

    return firstValueFrom(this.lessonService.getVideoUrl(body.objectKey));
  }

  @ApiOperation({
    summary: 'Upload video directly to S3',
    description:
      'Uploads a video file directly to AWS S3 storage. Works with any file size by bypassing NATS limitations.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Video file to upload',
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (MP4, AVI, MOV, WMV, WebM) - Max 3GB',
        },
      },
      required: ['video'],
    },
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'The unique identifier of the chapter',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Video uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Video uploaded successfully' },
        videoUrl: {
          type: 'string',
          example: 'https://your-bucket.s3.amazonaws.com/...',
          description: 'Direct S3 URL of the uploaded video',
        },
        objectKey: {
          type: 'string',
          example: 'userId/courses/courseId/lessons/lessonId/uuid-video.mp4',
          description: 'S3 object key for the uploaded video',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or missing data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can upload videos',
  })
  @ApiResponse({
    status: 404,
    description: 'Course or lesson not found',
  })
  @Post(':chapterId/:lessonId/video/upload-direct')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideoDirectly(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    console.log('Direct video upload request user:', req.user);
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!ownerId) {
      console.error('User identification failed. User object:', req.user);
      throw new Error('Authentication required - No user found');
    }

    if (!file) {
      throw new Error('Video file is required');
    }

    console.log('File details:', {
      mimetype: file.mimetype,
      size: file.size,
      name: file.originalname,
    });

    // Validate file size (3GB limit for S3)
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      throw new Error(
        `File size too large. Maximum size is 3GB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`,
      );
    }

    try {
      const awsRegion = process.env.AWS_S3_REGION_LMS;
      if (!awsRegion) {
        throw new Error('AWS_S3_REGION is required in .env');
      }
      // Get lesson details to determine userId
      const lessonResponse = await firstValueFrom(
        this.lessonService.getLesson(lessonId, courseId),
      );
      const lesson = lessonResponse.lesson;
      const userId = lesson.createdBy || ownerId;

      // Create S3 client directly (bypass NATS)
      const s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID_LMS!,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY_LMS!,
        },
      });

      // Generate object key with chapterId included
      const objectKey = `courses/${userId}/${courseId}/chapters/${lesson.chapterId}/lessons/${lessonId}/${uuidv4()}-${file.originalname}`;
      const bucketName = process.env.AWS_S3_BUCKET_LMS;

      console.log('Uploading to S3:', {
        bucketName,
        objectKey,
        fileSize: file.size,
      });

      // Convert buffer to stream for S3 upload
      const stream = Readable.from(file.buffer);

      // Upload directly to S3 (no NATS involvement)
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: stream,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      await s3Client.send(command);
      console.log('S3 upload successful:', objectKey);

      // Update lesson with video information (only small metadata via NATS)
      await firstValueFrom(
        this.lessonService.uploadVideoDirectly(
          courseId,
          lessonId,
          {
            objectKey,
            videoUrl: `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${objectKey}`,
            hasVideo: true,
            size: file.size,
            mimetype: file.mimetype,
            originalName: file.originalname,
          },
          ownerId,
        ),
      );

      const videoUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${objectKey}`;

      return {
        message: 'Video uploaded successfully',
        videoUrl,
        objectKey,
        size: file.size,
      };
    } catch (error) {
      console.error('Video upload error:', error);
      if (error.message.includes('credential')) {
        throw new Error(
          'AWS credentials are invalid or missing. Please check AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables in API Gateway.',
        );
      }
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  @Get(':lessonId')
  async getLesson(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    return firstValueFrom(this.lessonService.getLesson(lessonId, courseId));
  }

  @ApiOperation({
    summary: 'Upload file to lesson',
    description:
      'Uploads a file directly to AWS S3 storage for lesson content. Only INSTRUCTOR_USER role can upload files.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload (PDF, DOC, PPT, images, etc.)',
        },
      },
      required: ['file'],
    },
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'The unique identifier of the chapter',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'File uploaded successfully' },
        fileUrl: {
          type: 'string',
          example: 'https://bucket.s3.region.amazonaws.com/lesson/file.pdf',
        },
        objectKey: { type: 'string', example: 'lesson/file.pdf' },
        size: { type: 'number', example: 5242880 },
        assetId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can upload files',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, chapter, or lesson not found',
  })
  @Post(':chapterId/:lessonId/upload')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const instructorId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;

    if (!instructorId) {
      throw new Error('Authentication required - No user found');
    }

    if (!file) {
      throw new Error('File is required');
    }

    try {
      // Generate unique object key
      const fileExtension = file.originalname.split('.').pop();
      const uniqueId = uuidv4();
      const objectKey = `courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/${uniqueId}-${file.originalname}`;

      // Upload directly to S3
      const bucketName = process.env.AWS_S3_BUCKET_LMS;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      console.log('S3 upload successful:', objectKey);

      // Create asset record via LMS service (only metadata)
      const result = (await firstValueFrom(
        this.lessonService.createAssetRecord(
          courseId,
          chapterId,
          lessonId,
          instructorId,
          {
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            objectKey,
            fileUrl: `https://${bucketName}.s3.${process.env.AWS_S3_REGION_LMS}.amazonaws.com/${objectKey}`,
          },
        ),
      )) as {
        assetId: string;
        lessonId: string;
        objectKey: string;
        fileName: string;
        size: number;
        mimeType: string;
        fileUrl: string;
      };

      const fileUrl = `https://${bucketName}.s3.${process.env.AWS_S3_REGION_LMS}.amazonaws.com/${objectKey}`;

      return {
        message: 'File uploaded successfully',
        fileUrl,
        objectKey,
        size: file.size,
        assetId: result.assetId,
      };
    } catch (error) {
      console.error('File upload error:', error);
      if (error.message.includes('credential')) {
        throw new Error(
          'AWS credentials are invalid or missing. Please check AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables in API Gateway.',
        );
      }
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}
