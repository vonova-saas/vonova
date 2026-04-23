import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @MessagePattern({ cmd: 'library.upload.createAsset' })
  async createAsset(
    @Payload()
    data: {
      itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION';
      itemId: string;
      metadata: {
        originalFileName: string;
        mimeType: string;
        size: number;
        objectKey: string;
        fileUrl: string;
      };
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { itemType, itemId, metadata, user } = data;
    if (!itemType || !itemId || !metadata)
      throw new Error('itemType, itemId and metadata are required');

    // Extract userId from multiple possible sources like course module
    const userId = user?.id || user?.sub || user?._id;
    if (!userId) throw new Error('User identification is required');

    return this.uploadService.createAssetRecord(
      itemType,
      itemId,
      userId,
      metadata.originalFileName,
      metadata.mimeType,
      metadata.size,
      metadata.objectKey,
      metadata.fileUrl,
    );
  }

  @MessagePattern({ cmd: 'library.upload.direct' })
  async directUpload(
    @Payload()
    data: {
      itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION';
      itemId: string;
      file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      };
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { itemType, itemId, file, user } = data;
    if (!itemType || !itemId || !file)
      throw new Error('itemType, itemId and file are required');

    // Extract userId from multiple possible sources like course module
    const userId = user?.id || user?.sub || user?._id;
    if (!userId) throw new Error('User identification is required');

    return this.uploadService.directUpload(
      itemType,
      itemId,
      userId,
      file.originalname,
      file.mimetype,
      file.size,
      file.buffer,
    );
  }

  @MessagePattern({ cmd: 'library.upload.presign' })
  async presign(
    @Payload()
    data: {
      itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION';
      itemId: string;
      fileName: string;
      mimeType: string;
      size: number;
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { itemType, itemId, fileName, mimeType, size, user } = data;
    if (!itemType || !itemId || !fileName || !mimeType || !size)
      throw new Error(
        'itemType, itemId, fileName, mimeType and size are required',
      );

    // Extract userId from multiple possible sources like course module
    const userId = user?.id || user?.sub || user?._id;
    if (!userId) throw new Error('User identification is required');

    return this.uploadService.presignFile(
      itemType,
      itemId,
      userId,
      fileName,
      mimeType,
      size,
    );
  }

  @MessagePattern({ cmd: 'library.upload.complete' })
  async complete(
    @Payload()
    data: {
      itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION';
      itemId: string;
      assetId: string;
      objectKey: string;
      user?: { id?: string; sub?: string; _id?: string };
    },
  ) {
    const { itemType, itemId, assetId, objectKey, user } = data;
    if (!itemType || !itemId || !assetId || !objectKey)
      throw new Error('itemType, itemId, assetId and objectKey are required');

    // Extract userId from multiple possible sources like course module
    const userId = user?.id || user?.sub || user?._id;
    if (!userId) throw new Error('User identification is required');

    return this.uploadService.completeUpload(
      itemType,
      itemId,
      userId,
      assetId,
      objectKey,
    );
  }

  @MessagePattern({ cmd: 'library.upload.generateAndStorePresignedUrl' })
  async generateAndStorePresignedUrl(@Payload() data: { assetId: string }) {
    const { assetId } = data;
    if (!assetId) throw new Error('assetId is required');

    return this.uploadService.generateAndStorePresignedUrl(assetId);
  }

  @MessagePattern({ cmd: 'library.upload.getValidPresignedUrl' })
  async getValidPresignedUrl(@Payload() data: { assetId: string }) {
    const { assetId } = data;
    if (!assetId) throw new Error('assetId is required');

    return this.uploadService.getValidPresignedUrl(assetId);
  }
}
