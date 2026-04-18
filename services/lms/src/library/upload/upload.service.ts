import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '../schema/book/book.schema';
import { Guide } from '../schema/guide.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Presentation } from '../schema/presentation.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly s3Service: S3Service,

    @InjectModel(LibraryAsset.name)
    private readonly assetModel: Model<LibraryAsset>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,

    @InjectModel(Guide.name)
    private readonly guideModel: Model<Guide>,

    @InjectModel(Presentation.name)
    private readonly presModel: Model<Presentation>,
  ) {}

  async createAssetRecord(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId: string,
    fileName: string,
    mimeType: string,
    size: number,
    objectKey: string,
    fileUrl: string,
  ) {
    const { model } = await this.ensureOwner(itemType, itemId, ownerId);

    // Create asset record with S3 URL
    const asset = await this.assetModel.create({
      ownerId,
      itemType,
      itemId: model._id,
      objectKey,
      originalFileName: fileName,
      mimeType,
      size,
      status: 'UPLOADED',
      provider: 'S3',
      urls: { 
        sourceUrl: fileUrl,
        streamUrl: fileUrl,
      },
    });

    // Link file to item
    if (itemType === 'BOOK')
      await this.bookModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
      });
    if (itemType === 'GUIDE')
      await this.guideModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
      });
    if (itemType === 'PRESENTATION')
      await this.presModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
      });

    return { 
      assetId: asset.id, 
      itemId,
      objectKey,
      fileName,
      size,
      mimeType,
      fileUrl,
    };
  }

  async directUpload(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId: string,
    fileName: string,
    mimeType: string,
    size: number,
    fileBuffer: Buffer,
  ) {
    const { model } = await this.ensureOwner(itemType, itemId, ownerId);

    const objectKey = this.s3Service.generateLibraryObjectKey(
      itemType.toLowerCase(),
      itemId,
      fileName,
    );

    // Upload file directly to S3
    const uploadResult = await this.s3Service.uploadFileToLibrary(
      objectKey,
      fileBuffer,
      mimeType,
    );

    const asset = await this.assetModel.create({
      ownerId,
      itemType,
      itemId: model._id,
      objectKey,
      originalFileName: fileName,
      mimeType,
      size,
      status: 'UPLOADED',
      provider: 'S3',
      urls: { 
        sourceUrl: uploadResult.location,
        streamUrl: uploadResult.location,
      },
    });

    // Link file to item and store the AWS S3 URL
    const fileUrl = uploadResult.location;
    if (itemType === 'BOOK')
      await this.bookModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });
    if (itemType === 'GUIDE')
      await this.guideModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });
    if (itemType === 'PRESENTATION')
      await this.presModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });

    return { 
      assetId: asset.id, 
      itemId,
      objectKey,
      fileName,
      size,
      mimeType,
      location: uploadResult.location,
    };
  }

  async presignFile(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId: string,
    fileName: string,
    mimeType: string,
    size: number,
  ) {
    const { model } = await this.ensureOwner(itemType, itemId, ownerId);

    const objectKey = this.s3Service.generateLibraryObjectKey(
      itemType.toLowerCase(),
      itemId,
      fileName,
    );
    const uploadUrl = await this.s3Service.getPresignedPutUrlForLibrary(
      objectKey,
      mimeType,
    );

    const asset = await this.assetModel.create({
      ownerId,
      itemType,
      itemId: model._id,
      objectKey,
      originalFileName: fileName,
      mimeType,
      size,
      status: 'UPLOADING',
      provider: 'S3',
      urls: { sourceUrl: `s3://${objectKey}` },
    });

    return { uploadUrl, assetId: asset.id, objectKey };
  }

  async completeUpload(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId: string,
    assetId: string,
    objectKey: string,
  ) {
    await this.ensureOwner(itemType, itemId, ownerId);

    const exists = await this.s3Service.headObjectExistsInLibrary(objectKey);
    if (!exists)
      throw new NotFoundException('Uploaded file not found in bucket');

    const asset = await this.assetModel.findById(assetId);
    if (!asset) throw new NotFoundException('Asset not found');

    asset.status = 'UPLOADED';
    asset.urls.streamUrl = asset.urls.sourceUrl;
    await asset.save();

    // Link file to item and store the AWS S3 URL
    const fileUrl = asset.urls.sourceUrl;
    if (itemType === 'BOOK')
      await this.bookModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });
    if (itemType === 'GUIDE')
      await this.guideModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });
    if (itemType === 'PRESENTATION')
      await this.presModel.findByIdAndUpdate(itemId, {
        fileAssetId: asset._id,
        fileUrl: fileUrl,
      });

    return { assetId: asset.id, itemId };
  }

  private async ensureOwner(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId: string,
  ) {
    let model: any = null;

    if (itemType === 'BOOK') model = await this.bookModel.findById(itemId);
    if (itemType === 'GUIDE') model = await this.guideModel.findById(itemId);
    if (itemType === 'PRESENTATION')
      model = await this.presModel.findById(itemId);

    if (!model) throw new NotFoundException('Item not found');

    if (String(model.createdBy) !== ownerId)
      throw new ForbiddenException('Not owner of this item');

    return { model };
  }
}
