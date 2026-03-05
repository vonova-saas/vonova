import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PresignDto, CompleteDto } from './dto/upload.dto';

@Injectable()
export class UploadGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  presignFile(
    itemType: string,
    itemId: string,
    ownerId: string,
    dto: PresignDto,
  ) {
    return this.client.send(
      { cmd: 'library.upload.presign' },
      {
        itemType,
        itemId,
        ownerId,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
      },
    );
  }

  completeUpload(
    itemType: string,
    itemId: string,
    ownerId: string,
    dto: CompleteDto,
  ) {
    return this.client.send(
      { cmd: 'library.upload.complete' },
      {
        itemType,
        itemId,
        ownerId,
        assetId: dto.assetId,
        objectKey: dto.objectKey,
      },
    );
  }
}
