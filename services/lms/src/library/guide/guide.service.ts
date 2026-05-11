import { Model, Types } from 'mongoose';
import { Guide, GuideDocument } from '../schema/guide.schema';
import { S3Service } from '../../common/utils/storage/s3.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LibraryAsset,
  LibraryAssetDocument,
} from '../schema/library-asset.schema';
import { CreateGuideDto, UpdateGuideDto } from './dto/guide.dto';

@Injectable()
export class GuideService {
  constructor(
    private readonly s3Service: S3Service,
    @InjectModel(Guide.name) private readonly guideModel: Model<GuideDocument>,
    @InjectModel(LibraryAsset.name)
    private readonly libraryAssetModel: Model<LibraryAssetDocument>,
  ) {}

  async createGuideService(
    payload: CreateGuideDto | Partial<GuideDocument>,
    userId: string,
  ) {
    // Mongoose coerces ObjectId-shaped strings (courseId/lessonId) at create time,
    // so accepting the DTO directly keeps the gateway → LMS spread chain clean.
    const guideData = {
      ...(payload as Record<string, unknown>),
      createdBy: userId,
      status:
        (payload as { status?: string }).status ?? ('PUBLISHED' as const),
    };
    const guide = await this.guideModel.create(guideData);
    if (!guide) throw new BadRequestException('Guide not created');
    return guide;
  }

  async publishGuideService(id: string, dto: any, userId: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    if (guide.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to publish this guide',
      );

    guide.status = dto.status;
    await guide.save();
    return guide;
  }

  async listGuidesService(query: {
    q?: string;
    topics?: string[];
    level?: string;
    sort?: string;
    page?: number;
    limit?: number;
    status?: string;
    userRole?: string;
    userId?: string;
  }) {
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
      // Instructors can see all guides they created, plus all published guides
      if (userId) {
        filter.$or = [{ createdBy: userId }, { status: 'PUBLISHED' }];
      }
    } else {
      // Students and other roles only see published guides
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
    if (topics && topics.length) filter.topics = { $in: topics };
    if (level) filter.level = level;

    const sortMap: Record<string, any> = {
      new: { createdAt: -1 },
      popular: { 'metrics.favoritesCount': -1 },
      rating: { 'metrics.ratingAverage': -1 },
    };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.guideModel
        .find(filter)
        .sort(sortMap[sort] || sortMap.new)
        .skip(skip)
        .limit(limit),
      this.guideModel.countDocuments(filter),
    ]);

    // Generate or retrieve presigned URLs for guides with fileAssetId
    const guidesWithUrls = await Promise.all(
      items.map(async (guide) => {
        const guideObj = guide.toObject();

        if (guide.fileAssetId) {
          try {
            const asset = await this.libraryAssetModel.findById(
              guide.fileAssetId,
            );
            if (asset?.objectKey) {
              let contentUrl: string | undefined;

              // Check if we have a valid stored presigned URL
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

              // Generate new presigned URL if none exists or expired
              if (!contentUrl) {
                contentUrl = await this.s3Service.getPresignedGetUrl(
                  asset.objectKey,
                );
                // Store the new presigned URL in database with 1 hour expiration
                const expiresAt = new Date(Date.now() + 3600 * 1000);
                await this.libraryAssetModel.findByIdAndUpdate(
                  guide.fileAssetId,
                  {
                    'urls.presignedUrl': contentUrl,
                    'urls.presignedUrlExpiresAt': expiresAt,
                  },
                );
              }

              (guideObj as any).contentUrl = contentUrl;
            }
          } catch (error) {
            console.error(
              `Failed to generate presigned URL for guide ${guide._id}:`,
              error,
            );
            // Continue without presigned URL - the guide can still be returned
          }
        }

        return guideObj;
      }),
    );

    return { items: guidesWithUrls, total, page, limit };
  }

  async getGuideByIdService(id: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');

    const guideObj = guide.toObject();

    if (guide.fileAssetId) {
      try {
        const asset = await this.libraryAssetModel.findById(guide.fileAssetId);
        if (asset?.objectKey) {
          let contentUrl: string | undefined;

          // Check if we have a valid stored presigned URL
          if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);

            if (now < expiresAt) {
              contentUrl = asset.urls.presignedUrl;
            }
          }

          // Generate new presigned URL if none exists or expired
          if (!contentUrl) {
            contentUrl = await this.s3Service.getPresignedGetUrl(
              asset.objectKey,
            );
            // Store the new presigned URL in database with 1 hour expiration
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await this.libraryAssetModel.findByIdAndUpdate(guide.fileAssetId, {
              'urls.presignedUrl': contentUrl,
              'urls.presignedUrlExpiresAt': expiresAt,
            });
          }

          (guideObj as any).contentUrl = contentUrl;
        }
      } catch (error) {
        console.error(
          `Failed to generate presigned URL for guide ${guide._id}:`,
          error,
        );
        // Continue without presigned URL
      }
    }

    return guideObj;
  }

  async getGuideBySlugService(slug: string) {
    const guide = await this.guideModel.findOne({ slug });
    if (!guide) throw new NotFoundException('Guide not found');

    const guideObj = guide.toObject();

    if (guide.fileAssetId) {
      try {
        const asset = await this.libraryAssetModel.findById(guide.fileAssetId);
        if (asset?.objectKey) {
          let contentUrl: string | undefined;

          // Check if we have a valid stored presigned URL
          if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);

            if (now < expiresAt) {
              contentUrl = asset.urls.presignedUrl;
            }
          }

          // Generate new presigned URL if none exists or expired
          if (!contentUrl) {
            contentUrl = await this.s3Service.getPresignedGetUrl(
              asset.objectKey,
            );
            // Store the new presigned URL in database with 1 hour expiration
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await this.libraryAssetModel.findByIdAndUpdate(guide.fileAssetId, {
              'urls.presignedUrl': contentUrl,
              'urls.presignedUrlExpiresAt': expiresAt,
            });
          }

          (guideObj as any).contentUrl = contentUrl;
        }
      } catch (error) {
        console.error(
          `Failed to generate presigned URL for guide ${guide._id}:`,
          error,
        );
        // Continue without presigned URL
      }
    }

    return guideObj;
  }

  async getGuideContentService(guideId: string) {
    const guide = await this.guideModel.findById(guideId);
    if (!guide) throw new NotFoundException('Guide not found');

    let contentUrl: string | undefined;
    if (guide.fileAssetId) {
      const asset = await this.libraryAssetModel.findById(guide.fileAssetId);
      if (asset?.objectKey)
        contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
    }

    this.guideModel
      .updateOne({ _id: guide._id }, { $inc: { 'metrics.views': 1 } })
      .catch(() => {});

    return {
      id: String(guide._id),
      title: guide.title,
      summary: guide.summary,
      description: guide.description,
      authors: guide.authors,
      topics: guide.topics,
      level: guide.level,
      coverUrl: guide.coverUrl,
      language: guide.language,
      contentUrl,
    };
  }

  async updateGuideService(id: string, dto: UpdateGuideDto, userId: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    if (guide.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to update this guide',
      );

    if (dto.title) guide.title = dto.title;
    if (dto.slug) guide.slug = dto.slug;
    if (dto.summary) guide.summary = dto.summary;
    if (dto.description) guide.description = dto.description;
    if (dto.level) guide.level = dto.level;
    if (dto.coverUrl) guide.coverUrl = dto.coverUrl;
    if (dto.language) guide.language = dto.language;
    if (dto.badges) guide.badges = dto.badges;

    if (dto.authors) {
      dto.authors.forEach((updatedAuthor) => {
        const index = guide.authors.findIndex(
          (a) => a.name === updatedAuthor.name,
        );
        if (index !== -1) {
          guide.authors[index] = { ...guide.authors[index], ...updatedAuthor };
        } else {
          guide.authors.push(updatedAuthor);
        }
      });
    }

    if (dto.topics) {
      guide.topics = [...new Set([...guide.topics, ...dto.topics])];
    }

    await guide.save();
    return guide;
  }

  async deleteGuideService(id: string, userId: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    if (guide.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to delete this guide',
      );

    await guide.deleteOne();
    return { message: 'Guide deleted successfully' };
  }

  async getAllGuideLinksService() {
    const guides = await this.guideModel.find({
      fileAssetId: { $exists: true, $ne: null },
    });

    const links = await Promise.all(
      guides.map(async (guide) => {
        try {
          if (guide.fileAssetId) {
            const asset = await this.libraryAssetModel.findById(
              guide.fileAssetId,
            );
            if (asset?.objectKey) {
              const presignedUrl = await this.s3Service.getPresignedGetUrl(
                asset.objectKey,
              );
              return {
                id: guide._id,
                title: guide.title,
                slug: guide.slug,
                fileName:
                  asset.originalFileName || asset.objectKey.split('/').pop(),
                objectKey: asset.objectKey,
                presignedUrl,
                uploadedAt: (guide as any).createdAt,
                contentType: asset.mimeType,
                size: asset.size,
              };
            }
          }
        } catch (error) {
          console.error(
            `Failed to generate presigned URL for guide ${guide._id}:`,
            error,
          );
          return {
            id: guide._id,
            title: guide.title,
            slug: guide.slug,
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
