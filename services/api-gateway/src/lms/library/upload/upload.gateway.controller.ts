import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UploadGatewayService } from './upload.gateway.service';
import { CompleteDto, PresignDto } from './dto/upload.dto';

@ApiTags('LMS Library Upload')
@ApiBearerAuth()
@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class UploadGatewayController {
  constructor(private readonly uploadService: UploadGatewayService) {}

  @ApiOperation({
    summary: 'Get presigned URL for file upload',
    description:
      'Generates a presigned URL for uploading files to cloud storage for library items.',
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
  @ApiHeader({
    name: 'x-user-id',
    description: 'Optional user ID header (alternative to JWT token)',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://s3.amazonaws.com/bucket/presigned-url',
        },
        fields: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              example: 'uploads/2023/javascript-guide.pdf',
            },
            policy: { type: 'string', example: 'base64-policy' },
            'x-amz-signature': { type: 'string', example: 'signature' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token or x-user-id required',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  @Post(':itemType/:itemId/file/presign')
  async presign(
    @Param('itemType') itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    @Param('itemId') itemId: string,
    @Body() body: PresignDto,
    @Request() req: ExpressRequest,
    @Headers('x-user-id') xUserId?: string,
  ) {
    // Auth removed as requested — ownerId resolved from req.user?.id or header x-user-id
    const ownerId = (req as any).user?.id ?? xUserId;
    return firstValueFrom(
      this.uploadService.presignFile(itemType, itemId, ownerId, body),
    );
  }

  @Post(':itemType/:itemId/file/complete')
  async complete(
    @Param('itemType') itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    @Param('itemId') itemId: string,
    @Body() body: CompleteDto,
    @Request() req: ExpressRequest,
    @Headers('x-user-id') xUserId?: string,
  ) {
    const ownerId = (req as any).user?.id ?? xUserId;
    return firstValueFrom(
      this.uploadService.completeUpload(itemType, itemId, ownerId, body),
    );
  }
}
