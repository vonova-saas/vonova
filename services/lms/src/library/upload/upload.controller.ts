import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @MessagePattern({ cmd: 'library.upload.presign' })
  async presign(@Payload() data: { itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION'; itemId: string; ownerId: string; fileName: string; mimeType: string; size: number }) {
    const { itemType, itemId, ownerId, fileName, mimeType, size } = data;
    if (!itemType || !itemId || !ownerId || !fileName || !mimeType || !size) throw new Error('itemType, itemId, ownerId, fileName, mimeType and size are required');

    return this.uploadService.presignFile(itemType, itemId, ownerId, fileName, mimeType, size);
  }

  @MessagePattern({ cmd: 'library.upload.complete' })
  async complete(@Payload() data: { itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION'; itemId: string; ownerId: string; assetId: string; objectKey: string }) {
    const { itemType, itemId, ownerId, assetId, objectKey } = data;
    if (!itemType || !itemId || !ownerId || !assetId || !objectKey) throw new Error('itemType, itemId, ownerId, assetId and objectKey are required');

    return this.uploadService.completeUpload(itemType, itemId, ownerId, assetId, objectKey);
  }
}