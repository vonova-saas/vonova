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
  BadRequestException,
  GoneException,
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
import { CommunitySocialGatewayService } from 'src/app/community/social.gateway.service';
import { CommunitySocketGateway } from 'src/community/socket/community.gateway';
import { scheduleNotificationFanOut } from 'src/app/community/community-notification.helper';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
  VideoUploadUrlDto,
  VideoPresignPutBodyDto,
  VideoConfirmBodyDto,
} from './dto/lesson.dto';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
@ApiTags('LMS Course Lessons')
@ApiBearerAuth()
@ApiTags('lessons')
@Controller('api/v1/lms/courses/:courseId/chapters/:chapterId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonGatewayController {
  constructor(
    private readonly lessonService: LessonGatewayService,
    private readonly social: CommunitySocialGatewayService,
    private readonly sockets: CommunitySocketGateway,
  ) {}

  private lessonUploadS3: S3Client | null = null;

  private getLessonUploadS3Client(): S3Client {
    if (this.lessonUploadS3) return this.lessonUploadS3;
    const region =
      process.env.AWS_S3_REGION_LMS?.trim() || process.env.AWS_REGION?.trim();
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_LMS?.trim();
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_LMS?.trim();
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 LMS: set AWS_S3_REGION_LMS, AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS for lesson uploads.',
      );
    }
    this.lessonUploadS3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return this.lessonUploadS3;
  }

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
    const lesson = await firstValueFrom(
      this.lessonService.createLesson(courseId, chapterId, dto, ownerId),
    );
    const lessonId =
      (lesson as { _id?: string; data?: { _id?: string } })?._id ??
      (lesson as { data?: { _id?: string } })?.data?._id;
    const title =
      (lesson as { title?: string })?.title ??
      (lesson as { data?: { title?: string } })?.data?.title ??
      dto.title ??
      'New lesson';
    if (lessonId) {
      scheduleNotificationFanOut(this.social, this.sockets, {
        audience: {
          kind: 'courseEnrolled',
          courseId,
          excludeUserIds: [String(ownerId)],
        },
        template: {
          actorId: String(ownerId),
          type: 'LESSON_PUBLISHED',
          entityType: 'LESSON',
          entityId: String(lessonId),
          message: `New lesson published: ${title}`,
          meta: { courseId, lessonId: String(lessonId), chapterId },
        },
        dedupeEntityId: String(lessonId),
      });
    }
    return lesson;
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
    summary: 'Get presigned PUT URL for lesson video (upload to S3 from browser)',
  })
  @Post(':lessonId/video/presign-put')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  async getLessonVideoPresignPut(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: VideoPresignPutBodyDto,
    @Request() req: any,
  ) {
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;
    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }
    if (!body?.fileName?.trim() || !body?.contentType?.trim()) {
      throw new BadRequestException('fileName and contentType are required');
    }
    return firstValueFrom(
      this.lessonService.getLessonVideoPresignedPut(
        courseId,
        lessonId,
        { fileName: body.fileName.trim(), contentType: body.contentType.trim() },
        ownerId,
      ),
    );
  }

  @ApiOperation({
    summary: 'Confirm lesson video after direct S3 PUT (validates object exists, saves videoObjectKey)',
  })
  @Post(':lessonId/video/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  async confirmLessonVideo(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: VideoConfirmBodyDto,
    @Request() req: any,
  ) {
    const ownerId =
      req.user?.id ||
      req.user?.sub ||
      req.user?._id?.toString() ||
      req.user?.userId;
    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }
    if (!body?.objectKey?.trim()) {
      throw new BadRequestException('objectKey is required');
    }
    return firstValueFrom(
      this.lessonService.confirmLessonVideoUpload(
        courseId,
        lessonId,
        body.objectKey.trim(),
        ownerId,
        body.fileSize,
      ),
    );
  }

  @ApiOperation({
    summary: 'Get presigned URL for video playback (instructor/student player)',
    description:
      'Generates a presigned S3 GET URL from a stored object key (expires in 1 hour).',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned GET URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        streamUrl: {
          type: 'string',
          example: 'https://your-bucket.s3.amazonaws.com/videos/...',
          description: 'Presigned URL for playback (expires in 1 hour)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing objectKey',
  })
  @Post(':lessonId/video/url')
  async getVideoUrl(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: VideoUploadUrlDto,
    @Request() req: any,
  ) {
    void req;
    if (!body.objectKey) {
      throw new BadRequestException('objectKey is required');
    }

    return firstValueFrom(
      this.lessonService.getVideoUrl(body.objectKey, courseId, lessonId),
    );
  }

  @ApiOperation({
    summary: 'Deprecated — use presign-put + S3 PUT + confirm',
  })
  @Post(':lessonId/video/upload-direct')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideoDirectlyDeprecated() {
    throw new GoneException(
      'Multipart video upload is disabled. Use POST .../lessons/:lessonId/video/presign-put, PUT the file to the returned URL, then POST .../video/confirm.',
    );
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
  @Post(':lessonId/upload')
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

    if (file.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        'Lesson videos must use presigned S3 upload (presign-put → PUT → confirm), not multipart upload.',
      );
    }

    try {
      // Generate unique object key
      const uniqueId = uuidv4();
      const objectKey = `courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/${uniqueId}-${file.originalname}`;

      const bucketName = process.env.AWS_S3_BUCKET_LMS?.trim();
      if (!bucketName) {
        throw new BadRequestException(
          'AWS_S3_BUCKET_LMS is required (no fallback bucket).',
        );
      }
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      const s3 = this.getLessonUploadS3Client();
      await s3.send(command);
      await s3.send(
        new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }),
      );
      console.log(
        `S3_UPLOAD_SUCCESS: ${JSON.stringify({
          bucket: bucketName,
          key: objectKey,
          size: file.size,
        })}`,
      );

      // Create asset record via LMS service (objectKey only)
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
          },
        ),
      )) as {
        assetId: string;
        lessonId: string;
        objectKey: string;
        fileName: string;
        size: number;
        mimeType: string;
      };

      return {
        message: 'File uploaded successfully',
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
