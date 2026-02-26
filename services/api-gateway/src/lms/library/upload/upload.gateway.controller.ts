import { Controller, Post, Param, Body, Headers, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UploadGatewayService } from './upload.gateway.service';
import { CompleteDto, PresignDto } from './dto/upload.dto';

@Controller('api/v1/lms/library/items')
@UseGuards(JwtAuthGuard)
export class UploadGatewayController {
  constructor(private readonly uploadService: UploadGatewayService) {}

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
    return firstValueFrom(this.uploadService.presignFile(itemType, itemId, ownerId, body));
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
    return firstValueFrom(this.uploadService.completeUpload(itemType, itemId, ownerId, body));
  }
}
