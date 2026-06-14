/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ContentGatewayService } from './content.gateway.service';
import { resolveRequesterUserId } from 'src/common/utils/request-user-id';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('LMS Course Content')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/content')
@UseGuards(JwtAuthGuard)
export class ContentGatewayController {
  private readonly logger = new Logger(ContentGatewayController.name);

  private contentUploadS3: S3Client | null = null;

  constructor(private readonly contentService: ContentGatewayService) {}

  private getContentUploadS3Client(): S3Client {
    if (this.contentUploadS3) return this.contentUploadS3;
    const region =
      process.env.AWS_S3_REGION_LMS?.trim() || process.env.AWS_REGION?.trim();
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_LMS?.trim();
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_LMS?.trim();
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 LMS: set AWS_S3_REGION_LMS, AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS for content uploads.',
      );
    }
    this.contentUploadS3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return this.contentUploadS3;
  }

  @ApiOperation({
    summary: 'Get course content tree',
    description:
      'Retrieves the complete content structure of a course including chapters and lessons.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course content tree retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              index: { type: 'number', example: 0 },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    title: {
                      type: 'string',
                      example: 'Variables and Data Types',
                    },
                    index: { type: 'number', example: 0 },
                    content: {
                      type: 'string',
                      example: 'Lesson content here...',
                    },
                    duration: { type: 'number', example: 1800 },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Get()
  async getCourseContentTree(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = resolveRequesterUserId(req);

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.contentService.getCourseContentTree(courseId, userId),
    );
  }

  @ApiOperation({
    summary: 'Get lesson content',
    description:
      'Retrieves the content of a specific lesson for the authenticated user based on their enrollment and access rights.',
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
    description: 'Lesson content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Introduction to JavaScript Variables',
        },
        content: {
          type: 'string',
          example:
            'Lesson content including text, video URLs, and resources...',
        },
        type: { type: 'string', example: 'VIDEO' },
        durationMinutes: { type: 'number', example: 45 },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'PDF' },
              title: { type: 'string', example: 'JavaScript Cheat Sheet' },
              url: {
                type: 'string',
                example: 'https://example.com/resource.pdf',
              },
            },
          },
        },
        isCompleted: { type: 'boolean', example: false },
        progress: { type: 'number', example: 0.3 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to lesson content',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, lesson, or content not found',
  })
  @Get('lessons/:lessonId/content')
  async getLessonContent(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = resolveRequesterUserId(req);

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.contentService.getLessonContent(courseId, lessonId, userId),
    );
  }

  @ApiOperation({
    summary: 'Upload file to course content',
    description:
      'Uploads a file directly to AWS S3 storage for course content. Only INSTRUCTOR_USER role can upload files.',
  })
  @ApiQuery({
    name: 'contentType',
    description: 'Type of content (lesson, chapter, or course)',
    enum: ['lesson', 'chapter', 'course'],
    example: 'lesson',
    required: true,
  })
  @ApiQuery({
    name: 'contentId',
    description:
      'The unique identifier of the content (lesson, chapter, or course ID)',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload (PDF, DOC, PPT, video, etc.)',
        },
      },
      required: ['file'],
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'File uploaded successfully' },
        fileUrl: {
          type: 'string',
          example:
            'https://bucket.s3.region.amazonaws.com/course/content/lesson/id/file.pdf',
        },
        objectKey: {
          type: 'string',
          example: 'course/content/lesson/id/file.pdf',
        },
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
    status: 500,
    description: 'Server error - AWS credentials or upload failed',
  })
  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('courseId') courseId: string,
    @Query('contentType') contentType: 'lesson' | 'chapter' | 'course',
    @Query('contentId') contentId: string,
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

    if (contentType === 'lesson' && file.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        'Video upload must use presigned S3 flow only: POST .../lessons/:lessonId/video/presign-put, browser PUT to AWS_S3_BUCKET_LMS, then POST .../video/confirm.',
      );
    }

    try {
      // Generate unique object key
      const fileExtension = file.originalname.split('.').pop();
      const uniqueId = uuidv4();
      const objectKey = `course/${courseId}/content/${contentType}/${contentId}/${uniqueId}-${file.originalname}`;

      const bucketName = process.env.AWS_S3_BUCKET_LMS?.trim();
      if (!bucketName) {
        throw new BadRequestException(
          'AWS_S3_BUCKET_LMS is required (no app-bucket or legacy fallback).',
        );
      }
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      const s3 = this.getContentUploadS3Client();
      await s3.send(command);
      this.logger.log(
        `S3 PutObject ok bucket=${bucketName} key=${objectKey} bytes=${file.size} contentType=${file.mimetype}`,
      );

      try {
        await s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          }),
        );
        this.logger.log(
          `S3_UPLOAD_SUCCESS: ${JSON.stringify({
            bucket: bucketName,
            key: objectKey,
            size: file.size,
          })}`,
        );
      } catch (verifyErr) {
        this.logger.error(
          `S3 object missing after PutObject key=${objectKey}: ${(verifyErr as Error).message}`,
        );
        throw new Error(
          'Upload failed verification: object not found in bucket after PUT.',
        );
      }

      // Create asset record via LMS service (objectKey only; no public URL stored)
      const result = (await firstValueFrom(
        this.contentService.createAssetRecord(
          courseId,
          contentType.toUpperCase() as 'LESSON' | 'CHAPTER' | 'COURSE',
          contentId,
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
        contentId: string;
        objectKey: string;
        fileName: string;
        size: number;
        mimeType: string;
      };

      this.logger.log(
        `Content upload complete courseId=${courseId} contentType=${contentType} contentId=${contentId} objectKey=${objectKey} assetId=${result.assetId}`,
      );

      return {
        message: 'File uploaded successfully',
        objectKey,
        size: file.size,
        assetId: result.assetId,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Content upload failed courseId=${courseId}: ${err?.message ?? error}`,
        err?.stack,
      );
      if (err?.message?.includes('credential')) {
        throw new Error(
          'AWS credentials are invalid or missing. Please check AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables in API Gateway.',
        );
      }
      throw new Error(`Failed to upload file: ${err?.message ?? String(error)}`);
    }
  }
}
