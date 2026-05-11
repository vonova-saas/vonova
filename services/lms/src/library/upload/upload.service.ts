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

/**
 * TTL for library file **GET** presigns (seconds). Must match what we persist in
 * `urls.presignedUrlExpiresAt` — otherwise Mongo thinks a URL is valid for 1h
 * while S3 rejects it after `AWS_S3_PRESIGN_EXPIRES_LMS_AI` (often 180s).
 */
const LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS = (() => {
  const raw = process.env.AWS_S3_LIBRARY_GET_PRESIGN_EXPIRES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 60 && n <= 604800) return n;
  return 3600;
})();

/**
 * When the cached presigned URL is no longer acceptable for S3 SigV4 URLs
 * (parses `X-Amz-Date` + `X-Amz-Expires`). Returns null if params are missing.
 */
function awsSigV4GetUrlRefreshAfter(url: string): Date | null {
  try {
    const u = new URL(url);
    const amzDate = u.searchParams.get('X-Amz-Date');
    const amzExpires = u.searchParams.get('X-Amz-Expires');
    if (!amzDate || !amzExpires) return null;
    const sec = Number.parseInt(amzExpires, 10);
    if (!Number.isFinite(sec) || sec <= 0) return null;
    if (!/^\d{8}T\d{6}Z$/.test(amzDate)) return null;
    const y = Number(amzDate.slice(0, 4));
    const mo = Number(amzDate.slice(4, 6)) - 1;
    const d = Number(amzDate.slice(6, 8));
    const h = Number(amzDate.slice(9, 11));
    const mi = Number(amzDate.slice(11, 13));
    const s = Number(amzDate.slice(13, 15));
    const issuedMs = Date.UTC(y, mo, d, h, mi, s);
    // Refresh ~2 minutes before AWS hard-expires the signature.
    const skewMs = 120_000;
    return new Date(issuedMs + sec * 1000 - skewMs);
  } catch {
    return null;
  }
}

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

    // Generate presigned URL for the uploaded file
    try {
      const presignedUrl = await this.s3Service.getPresignedGetUrl(
        asset.objectKey,
        LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS,
      );
      return {
        assetId: asset.id,
        itemId,
        presignedUrl,
        fileName: asset.originalFileName,
        mimeType: asset.mimeType,
        size: asset.size,
        expiresInSeconds: LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS,
      };
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      // Return basic info even if presigned URL fails
      return {
        assetId: asset.id,
        itemId,
        fileName: asset.originalFileName,
        mimeType: asset.mimeType,
        size: asset.size,
        error: 'Failed to generate presigned URL',
      };
    }
  }

  async getPresignedUrl(
    itemType: 'BOOK' | 'GUIDE' | 'PRESENTATION',
    itemId: string,
    ownerId?: string,
  ) {
    let model: any = null;

    if (itemType === 'BOOK') model = await this.bookModel.findById(itemId);
    if (itemType === 'GUIDE') model = await this.guideModel.findById(itemId);
    if (itemType === 'PRESENTATION')
      model = await this.presModel.findById(itemId);

    if (!model) throw new NotFoundException('Item not found');

    if (ownerId && String(model.createdBy) !== ownerId)
      throw new ForbiddenException('Not owner of this item');

    if (!model.fileAssetId) {
      throw new NotFoundException('No file uploaded for this item');
    }

    const asset = await this.assetModel.findById(model.fileAssetId);
    if (!asset || !asset.objectKey) {
      throw new NotFoundException('File asset not found');
    }

    try {
      const presignedUrl = await this.s3Service.getPresignedGetUrl(
        asset.objectKey,
        LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS,
      );
      return {
        presignedUrl,
        fileName: asset.originalFileName,
        contentType: asset.mimeType,
        size: asset.size,
        uploadedAt: (asset as any).createdAt,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getPresignedUrlForAsset(assetId: string, ownerId?: string) {
    const asset = await this.assetModel.findById(assetId);
    if (!asset || !asset.objectKey) {
      throw new NotFoundException('Asset not found');
    }

    if (ownerId && String(asset.ownerId) !== ownerId)
      throw new ForbiddenException('Not owner of this asset');

    try {
      const presignedUrl = await this.s3Service.getPresignedGetUrl(
        asset.objectKey,
        LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS,
      );
      return {
        presignedUrl,
        fileName: asset.originalFileName,
        contentType: asset.mimeType,
        size: asset.size,
        uploadedAt: (asset as any).createdAt,
        itemType: asset.itemType,
        itemId: asset.itemId,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generateAndStorePresignedUrl(assetId: string): Promise<string> {
    const asset = await this.assetModel.findById(assetId);
    if (!asset || !asset.objectKey) {
      throw new NotFoundException('Asset not found');
    }

    try {
      const ttl = LIBRARY_GET_OBJECT_PRESIGN_TTL_SECONDS;
      const presignedUrl = await this.s3Service.getPresignedGetUrl(
        asset.objectKey,
        ttl,
      );

      // Must align with S3 SigV4 lifetime (same as `ttl`), not a hard-coded 1h.
      const expiresAt = new Date(Date.now() + ttl * 1000 - 120_000);
      await this.assetModel.findByIdAndUpdate(assetId, {
        'urls.presignedUrl': presignedUrl,
        'urls.presignedUrlExpiresAt': expiresAt,
      });

      return presignedUrl;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getValidPresignedUrl(assetId: string): Promise<string> {
    const asset = await this.assetModel.findById(assetId);
    if (!asset || !asset.objectKey) {
      throw new NotFoundException('Asset not found');
    }

    // Check if we have a valid presigned URL (not expired)
    if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);
      const sigRefreshAfter = awsSigV4GetUrlRefreshAfter(asset.urls.presignedUrl);
      const withinDbTtl = now < expiresAt;
      const withinSigTtl =
        sigRefreshAfter == null ? true : now < sigRefreshAfter;

      if (withinDbTtl && withinSigTtl) {
        return asset.urls.presignedUrl;
      }
    }

    // Generate new presigned URL if none exists or expired
    return this.generateAndStorePresignedUrl(assetId);
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
