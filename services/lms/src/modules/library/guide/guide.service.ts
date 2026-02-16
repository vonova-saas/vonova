
import { Model, Types } from 'mongoose';
import { Guide, GuideDocument} from 'src/schemas/library/guide.schema';
import { S3Service } from '../../../utils/storage/s3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LibraryAsset, LibraryAssetDocument } from 'src/schemas/library/library-asset.schema';
import { UpdateGuideDto } from './dto/guide.dto';


export class GuideService {
constructor(
    private readonly s3Service: S3Service,
  @InjectModel(Guide.name) private readonly guideModel: Model<GuideDocument>,
  @InjectModel(LibraryAsset.name) private readonly libraryAssetModel: Model<LibraryAssetDocument>,
){}


  async createGuideService(payload: Partial<GuideDocument>) {
    const guide = await this.guideModel.create(payload);
    if (!guide) throw new BadRequestException('Guide not created');
    return guide;
  }

  async publishGuideService(id: string, status: 'PUBLISHED' | 'ARCHIVED') {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    guide.status = status;
    await guide.save();
    return guide;
  }

  async listGuidesService(query: { q?: string; topics?: string[]; level?: string; sort?: string; page?: number; limit?: number; status?: string; }) {
    const { q, topics, level, sort = 'new', page = 1, limit = 12, status = 'PUBLISHED' } = query;
    const filter: any = { status };

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
      this.guideModel.find(filter).sort(sortMap[sort] || sortMap.new).skip(skip).limit(limit),
      this.guideModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async getGuideByIdService(id: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    return guide;
  }

  async getGuideBySlugService(slug: string) {
    const guide = await this.guideModel.findOne({ slug });
    if (!guide) throw new NotFoundException('Guide not found');
    return guide;
  }

  async getGuideContentService(guideId: string) {
    const guide = await this.guideModel.findById(guideId);
    if (!guide) throw new NotFoundException('Guide not found');

    let contentUrl: string | undefined;
    if (guide.fileAssetId) {
      const asset = await this.libraryAssetModel.findById(guide.fileAssetId);
      if (asset?.objectKey) contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
    }

    this.guideModel.updateOne({ _id: guide._id }, { $inc: { 'metrics.views': 1 } }).catch(() => {});

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

async updateGuideService(id: string, dto: UpdateGuideDto) {
  const guide = await this.guideModel.findById(id);
  if (!guide) throw new NotFoundException('Guide not found');

  if (dto.title) guide.title = dto.title;
  if (dto.slug) guide.slug = dto.slug;
  if (dto.summary) guide.summary = dto.summary;
  if (dto.description) guide.description = dto.description;
  if (dto.level) guide.level = dto.level;
  if (dto.coverUrl) guide.coverUrl = dto.coverUrl;
  if (dto.language) guide.language = dto.language;
  if (dto.badges) guide.badges = dto.badges;

  if (dto.authors) {
    dto.authors.forEach(updatedAuthor => {
      const index = guide.authors.findIndex(a => a.name === updatedAuthor.name);
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



  async deleteGuideService(id: string) {
    const guide = await this.guideModel.findById(id);
    if (!guide) throw new NotFoundException('Guide not found');
    await guide.deleteOne();
    return {message:'Guide deleted successfully'};
  }
}
