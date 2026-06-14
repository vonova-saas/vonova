import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Presentation } from '../schema/presentation.schema';
import {
  CreatePresentationDto,
  UpdatePresentationDto,
  PublishPresentationDto,
} from './dto/presentition.dto';
import { S3Service } from '../../common/utils/storage/s3.service';
import {
  buildStableLmsMaterialViewUrl,
  stableMediaGetEnabled,
} from '../../common/media/stable-media-url';

@Injectable()
export class PresentationService {
  constructor(
    @InjectModel(Presentation.name)
    private presentationModel: Model<Presentation>,
    @InjectModel(LibraryAsset.name)
    private assetModel: Model<LibraryAsset>,
    private s3Service: S3Service,
  ) {}

  async create(dto: CreatePresentationDto, userId: string) {
    const presentationData = {
      ...dto,
      createdBy: userId,
      status: dto.status || 'PUBLISHED',
    };
    return await this.presentationModel.create(presentationData);
  }

  async update(id: string, dto: UpdatePresentationDto, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId)
      throw new ForbiddenException('Not owner');

    Object.assign(doc, dto);
    await doc.save();
    return doc;
  }

  async publish(id: string, dto: PublishPresentationDto, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId)
      throw new ForbiddenException('Not owner');

    Object.assign(doc, dto);
    await doc.save();
    return { message: 'Presentation published successfully' };
  }

  async delete(id: string, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId)
      throw new ForbiddenException('Not owner');
    await doc.deleteOne();
    return { message: 'Presentation deleted successfully' };
  }

  async findAll(query: any) {
    const {
      q,
      topics,
      level,
      sort = 'new',
      page = 1,
      limit = 12,
      status,
      userRole,
      userId,
    } = query;

    const filter: any = {};

    // Role-based filtering logic
    if (userRole === 'INSTRUCTOR_USER') {
      // Instructors can see all presentations they created, plus all published presentations
      if (userId) {
        filter.$or = [{ createdBy: userId }, { status: 'PUBLISHED' }];
      }
    } else {
      // Students and other roles only see published presentations
      filter.status = 'PUBLISHED';
    }

    // Apply explicit status filter if provided (but don't override role-based logic for students)
    if (status && userRole === 'INSTRUCTOR_USER') {
      if (userId) {
        filter.$or = [
          { createdBy: userId, status: status },
          { status: 'PUBLISHED' },
        ];
      }
    }
    if (q) filter.$text = { $search: q };

    // Fix topics parsing
    const parsedTopics = topics
      ? typeof topics === 'string'
        ? topics.split(',')
        : topics
      : undefined;

    if (parsedTopics) filter.topics = { $in: parsedTopics };

    if (level) filter.level = level;

    const sortMap = {
      new: { createdAt: -1 },
      popular: { 'metrics.favoritesCount': -1 },
      rating: { 'metrics.ratingAverage': -1 },
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.presentationModel
        .find(filter)
        .sort(sortMap[sort] || sortMap.new)
        .skip(skip)
        .limit(limit),
      this.presentationModel.countDocuments(filter),
    ]);

    // Generate or retrieve presigned URLs for presentations with fileAssetId
    const presentationsWithUrls = await Promise.all(
      items.map(async (presentation) => {
        const presentationObj = presentation.toObject();

        if (presentation.fileAssetId) {
          try {
            if (stableMediaGetEnabled()) {
              (presentationObj as { contentUrl?: string }).contentUrl =
                buildStableLmsMaterialViewUrl(
                  String(presentation._id),
                  'presentation',
                );
            } else {
            const asset = await this.assetModel.findById(
              presentation.fileAssetId,
            );
            if (asset?.objectKey) {
              let contentUrl: string | undefined;

              if (
                asset.urls?.presignedUrl &&
                asset.urls?.presignedUrlExpiresAt
              ) {
                const now = new Date();
                const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);

                if (now < expiresAt) {
                  contentUrl = asset.urls.presignedUrl;
                }
              }

              if (!contentUrl) {
                contentUrl = await this.s3Service.getPresignedGetUrl(
                  asset.objectKey,
                );
                const expiresAt = new Date(Date.now() + 3600 * 1000);
                await this.assetModel.findByIdAndUpdate(
                  presentation.fileAssetId,
                  {
                    'urls.presignedUrl': contentUrl,
                    'urls.presignedUrlExpiresAt': expiresAt,
                  },
                );
              }

              (presentationObj as { contentUrl?: string }).contentUrl =
                contentUrl;
            }
            }
          } catch (error) {
            console.error(
              `Failed to generate presigned URL for presentation ${presentation._id}:`,
              error,
            );
            // Continue without presigned URL
          }
        }

        return presentationObj;
      }),
    );

    return {
      items: presentationsWithUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');

    const presentationObj = doc.toObject();

    if (doc.fileAssetId) {
      try {
        if (stableMediaGetEnabled()) {
          (presentationObj as { contentUrl?: string }).contentUrl =
            buildStableLmsMaterialViewUrl(String(doc._id), 'presentation');
        } else {
        const asset = await this.assetModel.findById(doc.fileAssetId);
        if (asset?.objectKey) {
          let contentUrl: string | undefined;

          if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);

            if (now < expiresAt) {
              contentUrl = asset.urls.presignedUrl;
            }
          }

          if (!contentUrl) {
            contentUrl = await this.s3Service.getPresignedGetUrl(
              asset.objectKey,
            );
            // Store the new presigned URL in database with 1 hour expiration
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await this.assetModel.findByIdAndUpdate(doc.fileAssetId, {
              'urls.presignedUrl': contentUrl,
              'urls.presignedUrlExpiresAt': expiresAt,
            });
          }

          (presentationObj as { contentUrl?: string }).contentUrl = contentUrl;
        }
        }
      } catch (error) {
        console.error(
          `Failed to generate presigned URL for presentation ${doc._id}:`,
          error,
        );
      }
    }

    return presentationObj;
  }

  async getContent(id: string) {
    const pres = await this.presentationModel.findById(id);
    if (!pres) throw new NotFoundException('Presentation not found');

    let contentUrl: string | undefined;
    let posterUrl: string | undefined;

    if (pres.fileAssetId) {
      const asset = await this.assetModel.findById(pres.fileAssetId);
      if (asset && asset.objectKey) {
        contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
        posterUrl = asset.urls?.posterUrl;
      }
    }

    await this.presentationModel.updateOne(
      { _id: id },
      { $inc: { 'metrics.views': 1 } },
    );

    return {
      id,
      title: pres.title,
      summary: pres.summary,
      description: pres.description,
      authors: pres.authors,
      topics: pres.topics,
      level: pres.level,
      coverUrl: pres.coverUrl,
      language: pres.language,
      contentUrl,
      posterUrl,
    };
  }

  async getAllPresentationLinksService() {
    const presentations = await this.presentationModel.find({
      fileAssetId: { $exists: true, $ne: null },
    });

    const links = await Promise.all(
      presentations.map(async (presentation) => {
        try {
          if (presentation.fileAssetId) {
            const asset = await this.assetModel.findById(
              presentation.fileAssetId,
            );
            if (asset?.objectKey) {
              const presignedUrl = await this.s3Service.getPresignedGetUrl(
                asset.objectKey,
              );
              return {
                id: presentation._id,
                title: presentation.title,
                slug: presentation.slug,
                fileName:
                  asset.originalFileName || asset.objectKey.split('/').pop(),
                objectKey: asset.objectKey,
                presignedUrl,
                uploadedAt: (presentation as any).createdAt,
                contentType: asset.mimeType,
                size: asset.size,
              };
            }
          }
        } catch (error) {
          console.error(
            `Failed to generate presigned URL for presentation ${presentation._id}:`,
            error,
          );
          return {
            id: presentation._id,
            title: presentation.title,
            slug: presentation.slug,
            error: 'Failed to generate presigned URL',
          };
        }
        return null;
      }),
    );

    return {
      links: links.filter((link) => link !== null),
      total: links.filter((link) => link !== null).length,
    };
  }
}
