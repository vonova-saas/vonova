import LibraryAssetModel from "../../models/library/asset.model";
import GuideModel, { GuideDocument } from "../../models/library/guide.model";
import { NotFoundException, ForbiddenException, BadRequestException } from "../../utils/appError";
import { getPresignedGetUrl } from "../storage/s3.service";

export const createGuideService = async (payload: Partial<GuideDocument>, userId: string) => {
  const guide = await GuideModel.create({
    ...payload,
    createdBy: userId
  });

  if (!guide) {
    throw new BadRequestException("Guide not created");
  }

  return guide;
};

export const publishGuideService = async (id: string, status: "PUBLISHED" | "ARCHIVED", userId: string) => {
  const guide = await GuideModel.findById(id);
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  if (String(guide.createdBy) !== userId) {
    throw new ForbiddenException("Not owner");
  }

  (guide as any).status = status;
  await guide.save();

  return guide;
};


export const listGuidesService = async (query: { q?: string; topics?: string[]; level?: string; sort?: string; page?: number; limit?: number; status?: string; }) => {
  const { q, topics, level, sort = "new", page = 1, limit = 12, status = "PUBLISHED" } = query;
  const filter: any = { status };
  if (q) {
    filter.$text = { $search: q };
  }
  if (topics && topics.length) {
    filter.topics = { $in: topics };
  }
  if (level) {
    filter.level = level;
  }

  const sortMap: Record<string, any> = {
    new: { createdAt: -1 },
    popular: { "metrics.favoritesCount": -1 },
    rating: { "metrics.ratingAverage": -1 },
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    GuideModel.find(filter).sort(sortMap[sort] || sortMap.new).skip(skip).limit(limit),
    GuideModel.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit
  };
};

export const getGuideByIdService = async (id: string) => {
  const guide = await GuideModel.findById(id);
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  return guide;
};

export const getGuideBySlugService = async (slug: string) => {
  const guide = await GuideModel.findOne({ slug });
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  return guide;
};

// S3
export const getGuideContentService = async (guideId: string) => {
  const guide = await GuideModel.findById(guideId);
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  let contentUrl: string | undefined;
  if (guide.fileAssetId) {
    const asset = await LibraryAssetModel.findById(guide.fileAssetId);
    if (asset && asset.objectKey) {
      contentUrl = await getPresignedGetUrl(asset.objectKey);
    }
  }

  GuideModel.updateOne({ _id: guide._id }, { $inc: { "metrics.views": 1 } }).catch(() => { });
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
};

export const updateGuideService = async (id: string, payload: Partial<GuideDocument>, userId: string) => {
  const guide = await GuideModel.findById(id);
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  if (String(guide.createdBy) !== userId) {
    throw new ForbiddenException("Not owner");
  }

  Object.assign(guide, payload);
  await guide.save();
  return guide;
};


export const deleteGuideService = async (id: string, userId: string) => {
  const guide = await GuideModel.findById(id);
  if (!guide) {
    throw new NotFoundException("Guide not found");
  }

  if (String(guide.createdBy) !== userId) {
    throw new ForbiddenException("Not owner");
  }

  await guide.deleteOne();
  return guide;
};