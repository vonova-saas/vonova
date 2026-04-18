import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CompleteDto } from './dto/upload.dto';

export interface FileUploadRequest {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AssetMetadata {
  originalFileName: string;
  mimeType: string;
  size: number;
  objectKey: string;
  fileUrl: string;
}

@Injectable()
export class UploadGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createAssetRecord(
    itemType: string,
    itemId: string,
    userId: string,
    metadata: AssetMetadata,
  ) {
    return this.client.send(
      { cmd: 'library.upload.createAsset' },
      {
        itemType,
        itemId,
        metadata,
        user: { id: userId },
      },
    );
  }

  uploadFile(
    itemType: string,
    itemId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const uploadData: FileUploadRequest = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    return this.client.send(
      { cmd: 'library.upload.direct' },
      {
        itemType,
        itemId,
        file: uploadData,
        user: { id: userId },
      },
    );
  }

  completeUpload(
    itemType: string,
    itemId: string,
    userId: string,
    dto: CompleteDto,
  ) {
    return this.client.send(
      { cmd: 'library.upload.complete' },
      {
        itemType,
        itemId,
        assetId: dto.assetId,
        objectKey: dto.objectKey,
        user: { id: userId },
      },
    );
  }
}
