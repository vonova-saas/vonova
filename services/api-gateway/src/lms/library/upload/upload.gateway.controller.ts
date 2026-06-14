import {
  Controller,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
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
import { UploadGatewayService } from './upload.gateway.service';
import { CompleteDto } from './dto/upload.dto';
import {
  FileUploadDto,
  UploadResponseDto,
  UploadQueryDto,
  ErrorResponseDto,
} from './dto/upload-swagger.dto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('LMS Library Upload')
@ApiBearerAuth()
@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class UploadGatewayController {
  constructor(private readonly uploadService: UploadGatewayService) {}

  private s3Client: S3Client | null = null;

  private trimEnv(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private resolveS3Config() {
    const region =
      this.trimEnv(process.env.AWS_S3_REGION_LMS) ||
      this.trimEnv(process.env.AWS_S3_REGION_LMS_AI) ||
      this.trimEnv(process.env.AWS_REGION_LMS_AI) ||
      this.trimEnv(process.env.AWS_REGION) ||
      this.trimEnv(process.env.AWS_DEFAULT_REGION);

    const bucket =
      this.trimEnv(process.env.AWS_S3_BUCKET_LMS) ||
      this.trimEnv(process.env.AWS_S3_BUCKET_LMS_AI) ||
      this.trimEnv(process.env.AWS_S3_BUCKET) ||
      this.trimEnv(process.env.S3_BUCKET);

    const accessKeyId =
      this.trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS) ||
      this.trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS_AI) ||
      this.trimEnv(process.env.AWS_ACCESS_KEY_ID_LMS_AI) ||
      this.trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_APP) ||
      this.trimEnv(process.env.AWS_ACCESS_KEY_ID) ||
      this.trimEnv(process.env.AWS_S3_ACCESS_KEY_ID);

    const secretAccessKey =
      this.trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS) ||
      this.trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS_AI) ||
      this.trimEnv(process.env.AWS_SECRET_ACCESS_KEY_LMS_AI) ||
      this.trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_APP) ||
      this.trimEnv(process.env.AWS_SECRET_ACCESS_KEY) ||
      this.trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY);

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 library upload is not configured on the gateway. Set AWS_S3_REGION_LMS, AWS_S3_BUCKET_LMS, AWS_S3_ACCESS_KEY_ID_LMS, and AWS_S3_SECRET_ACCESS_KEY_LMS (or LMS_AI / generic AWS_* fallbacks). Do not use a separate App bucket for LMS library objects.',
      );
    }

    return { region, bucket, accessKeyId, secretAccessKey };
  }

  private getS3Client(config: ReturnType<UploadGatewayController['resolveS3Config']>) {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }

    return this.s3Client;
  }

  @ApiOperation({
    summary: 'Upload file to library',
    description:
      'Uploads a file directly to AWS S3 storage and returns the direct link. Works with any file size by bypassing NATS limitations.',
  })
  @ApiQuery({
    name: 'itemType',
    description: 'Type of item (book, presentation, or guide)',
    enum: ['book', 'presentation', 'guide'],
    example: 'book',
    required: true,
  })
  @ApiQuery({
    name: 'itemId',
    description: 'The unique identifier of the item',
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
          description: 'The file to upload (PDF, DOC, PPT, etc.)',
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
        presignedUrl: {
          type: 'string',
          example:
            'https://vonova-lms.s3.eu-north-1.amazonaws.com/library/guide/123456/file.pdf?X-Amz-Algorithm=...',
          description:
            'Presigned URL for accessing the uploaded file (expires in 1 hour)',
        },
        fileUrl: {
          type: 'string',
          example:
            'https://vonova-lms.s3.eu-north-1.amazonaws.com/library/guide/123456/file.pdf',
          description: 'Direct S3 URL for reference',
        },
        objectKey: { type: 'string', example: 'library/guide/123456/file.pdf' },
        size: { type: 'number', example: 1024000 },
        assetId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fileName: { type: 'string', example: 'document.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        expiresInSeconds: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can upload files',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Server error - AWS credentials or upload failed',
    type: ErrorResponseDto,
  })
  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Query('itemType') itemType: 'book' | 'presentation' | 'guide',
    @Query('itemId') itemId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    if (!file) {
      throw new Error('File is required');
    }

    try {
      // Generate unique object key
      const uniqueId = uuidv4();
      const objectKey = `library/${itemType}/${itemId}/${uniqueId}-${file.originalname}`;

      // Upload directly to S3
      const s3Config = this.resolveS3Config();
      const bucketName = s3Config.bucket;
      const s3Client = this.getS3Client(s3Config);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      let s3Host: string | undefined;
      try {
        s3Host = new URL(
          `https://${bucketName}.s3.${s3Config.region}.amazonaws.com`,
        ).hostname;
      } catch {
        s3Host = undefined;
      }
      console.log('[LIBRARY_UPLOAD]', {
        bucket: bucketName,
        region: s3Config.region,
        objectKey,
        contentType: file.mimetype,
        s3Host,
      });

      const viewUrl = `/api/v1/media/lms/materials/${encodeURIComponent(itemId)}/view?type=${encodeURIComponent(itemType.toLowerCase())}`;

      // Create asset record via LMS service (only metadata)
      const result = (await firstValueFrom(
        this.uploadService.createAssetRecord(
          itemType.toUpperCase() as 'BOOK' | 'PRESENTATION' | 'GUIDE',
          itemId,
          ownerId,
          {
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            objectKey,
            fileUrl: `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${objectKey}`,
          },
        ),
      )) as {
        assetId: string;
        itemId: string;
        objectKey: string;
        fileName: string;
        size: number;
        mimeType: string;
        fileUrl: string;
      };

      return {
        message: 'File uploaded successfully',
        viewUrl,
        objectKey,
        size: file.size,
        assetId: result.assetId,
        fileName: file.originalname,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown upload error';

      if (errorMessage.toLowerCase().includes('credential')) {
        throw new Error(
          'AWS credentials are invalid or missing. Please check AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS, AWS_S3_REGION_LMS, and AWS_S3_BUCKET_LMS environment variables in API Gateway.',
        );
      }
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  @ApiOperation({
    summary: 'Complete file upload',
    description:
      'Completes the file upload process after the file has been successfully uploaded to cloud storage.',
  })
  @ApiParam({
    name: 'itemType',
    description: 'Type of item (BOOK, GUIDE, or PRESENTATION)',
    enum: ['BOOK', 'GUIDE', 'PRESENTATION'],
    example: 'BOOK',
  })
  @ApiParam({
    name: 'itemId',
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'File upload completed successfully',
    schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        itemId: { type: 'string', example: '507f1f77bcf86cd799439012' },
        presignedUrl: {
          type: 'string',
          example:
            'https://vonova-lms.s3.eu-north-1.amazonaws.com/library/guide/123456/file.pdf?X-Amz-Algorithm=...',
          description:
            'Presigned URL for accessing the uploaded file (expires in 1 hour)',
        },
        fileName: { type: 'string', example: 'javascript-guide.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 5242880 },
        expiresInSeconds: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid completion data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  @Post(':itemType/:itemId/file/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR_USER)
  async complete(
    @Param('itemType') itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    @Param('itemId') itemId: string,
    @Body() body: CompleteDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub || req.user?._id;

    if (!ownerId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.uploadService.completeUpload(itemType, itemId, ownerId, body),
    );
  }
}
