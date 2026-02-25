import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Presentation } from '../schema/presentation.schema';
import { CreatePresentationDto, UpdatePresentationDto, PublishPresentationDto } from './dto/presentition.dto';
import { S3Service } from '../../common/utils/storage/s3.service';


@Injectable()
export class PresentationService {
  constructor(
    @InjectModel(Presentation.name)
    private presentationModel: Model<Presentation>,
    @InjectModel(LibraryAsset.name)
    private assetModel: Model<LibraryAsset>,
    private s3Service: S3Service
  ) {}

  async create(dto: CreatePresentationDto, userId: string) {
    return await this.presentationModel.create({ ...dto, createdBy: userId });
  }

  async update(id: string, dto: UpdatePresentationDto, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId) throw new ForbiddenException('Not owner');

    Object.assign(doc, dto);
    await doc.save();
    return doc;
  }

  async publish(id: string, dto: PublishPresentationDto, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId) throw new ForbiddenException('Not owner');

    Object.assign(doc, dto);
    await doc.save();
    return {message: 'Presentation published successfully'};
  }

  async delete(id: string, userId: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    if (String(doc.createdBy) !== userId) throw new ForbiddenException('Not owner');
    await doc.deleteOne();
    return {message: 'Presentation deleted successfully'};
  }

  async findAll(query: any) {
  const { q, topics, level, sort = 'new', page = 1, limit = 12, status } = query;

  const filter: any = {};

  if (status) filter.status = status;
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

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}


  async findById(id: string) {
    const doc = await this.presentationModel.findById(id);
    if (!doc) throw new NotFoundException('Presentation not found');
    return doc;
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

    await this.presentationModel.updateOne({ _id: id }, { $inc: { 'metrics.views': 1 } });

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
}
