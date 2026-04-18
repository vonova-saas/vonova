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
  ErrorResponseDto 
} from './dto/upload-swagger.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('LMS Library Upload')
@ApiBearerAuth()
@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class UploadGatewayController {
  constructor(private readonly uploadService: UploadGatewayService) {}

  private readonly s3Client = new S3Client({
    region: process.env.AWS_S3_REGION_LMS,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID_LMS!,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY_LMS!,
    },
  });

  @ApiOperation({
    summary: 'Upload file to library',
    description: 'Uploads a file directly to AWS S3 storage and returns the direct link. Works with any file size by bypassing NATS limitations.',
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
    type: UploadResponseDto,
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
      const fileExtension = file.originalname.split('.').pop();
      const uniqueId = uuidv4();
      const objectKey = `library/${itemType}/${itemId}/${uniqueId}-${file.originalname}`;
      
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
      const result = await firstValueFrom(
        this.uploadService.createAssetRecord(
          itemType.toUpperCase() as 'BOOK' | 'PRESENTATION' | 'GUIDE',
          itemId,
          ownerId,
          {
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            objectKey,
            fileUrl: `https://${bucketName}.s3.${process.env.AWS_S3_REGION_LMS}.amazonaws.com/${objectKey}`,
          }
        ),
      ) as { assetId: string; itemId: string; objectKey: string; fileName: string; size: number; mimeType: string; fileUrl: string };

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
        throw new Error('AWS credentials are invalid or missing. Please check AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables in API Gateway.');
      }
      throw new Error(`Failed to upload file: ${error.message}`);
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
        message: { type: 'string', example: 'File upload completed successfully' },
        fileUrl: {
          type: 'string',
          example: 'https://s3.amazonaws.com/bucket/uploads/javascript-guide.pdf',
        },
        fileName: { type: 'string', example: 'javascript-guide.pdf' },
        fileSize: { type: 'number', example: 5242880 },
        mimeType: { type: 'string', example: 'application/pdf' },
        uploadedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
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
