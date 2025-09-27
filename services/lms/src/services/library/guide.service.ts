import GuideModel, { GuideDocument } from "../../models/library/guide.model";
import { NotFoundException, ForbiddenException } from "../../utils/appError";

export const createGuideService = async (payload: Partial<GuideDocument>, userId: string) => {
  const doc = await GuideModel.create({ ...payload, createdBy: userId });
  return doc;
};

export const updateGuideService = async (id: string, payload: Partial<GuideDocument>, userId: string) => {
  const doc = await GuideModel.findById(id);
  if (!doc) throw new NotFoundException("Guide not found");
  if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
  Object.assign(doc, payload);
  await doc.save();
  return doc;
};

export const publishGuideService = async (id: string, status: "PUBLISHED"|"ARCHIVED", userId: string) => {
  const doc = await GuideModel.findById(id);
  if (!doc) throw new NotFoundException("Guide not found");
  if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
  (doc as any).status = status;
  await doc.save();
  return doc;
};

export const deleteGuideService = async (id: string, userId: string) => {
  const doc = await GuideModel.findById(id);
  if (!doc) throw new NotFoundException("Guide not found");
  if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
  await doc.deleteOne();
  return doc;
};

export const getGuideByIdService = async (id: string) => {
  const doc = await GuideModel.findById(id);
  if (!doc) throw new NotFoundException("Guide not found");
  return doc;
};

export const getGuideBySlugService = async (slug: string) => {
  const doc = await GuideModel.findOne({ slug });
  if (!doc) throw new NotFoundException("Guide not found");
  return doc;
};

export const listGuidesService = async (query: { q?: string; topics?: string[]; level?: string; sort?: string; page?: number; limit?: number; status?: string; }) => {
  const { q, topics, level, sort = "new", page = 1, limit = 12, status = "PUBLISHED" } = query;
  const filter: any = { status };
  if (q) filter.$text = { $search: q };
  if (topics && topics.length) filter.topics = { $in: topics };
  if (level) filter.level = level;
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
  return { items, total, page, limit };
};
