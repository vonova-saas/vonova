import { Controller, Post, Param, Body, Headers, Req } from '@nestjs/common';
import { Request } from 'express';
import { CompleteDto, PresignDto } from './dto/upload.dto';
import { UploadService } from './upload.service';


@Controller('library/items')
export class UploadController {
constructor(private readonly uploadService: UploadService) {}


@Post(':itemType/:itemId/file/presign')
async presign(
@Param('itemType') itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
@Param('itemId') itemId: string,
@Body() body: PresignDto,
@Req() req: Request,
@Headers('x-user-id') xUserId?: string,
) {
// Auth removed as requested — ownerId resolved from req.user?.id or header x-user-id
const ownerId = (req as any).user?.id ?? xUserId;
return this.uploadService.presignFile(itemType, itemId, ownerId, body.fileName, body.mimeType, body.size);
}


@Post(':itemType/:itemId/file/complete')
async complete(
@Param('itemType') itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
@Param('itemId') itemId: string,
@Body() body: CompleteDto,
@Req() req: Request,
@Headers('x-user-id') xUserId?: string,
) {
const ownerId = (req as any).user?.id ?? xUserId;
return this.uploadService.completeUpload(itemType, itemId, ownerId, body.assetId, body.objectKey);
}
}