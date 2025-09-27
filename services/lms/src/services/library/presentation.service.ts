import LibraryAssetModel from "../../models/library/asset.model";
import PresentationModel, { PresentationDocument } from "../../models/library/presentation.model";
import { ForbiddenException, NotFoundException } from "../../utils/appError";




export const createPresentation = async (payload: Partial<PresentationDocument>, userId: string) => {
    const doc = await PresentationModel.create({ ...payload, createdBy: userId });
    return doc;
  };


  export const updatePresentation = async (id: string, payload: Partial<PresentationDocument>, userId: string) => {
    const doc = await PresentationModel.findById(id);
    if (!doc) throw new NotFoundException("Presentation not found");
    if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
    Object.assign(doc, payload);
    await doc.save();
    return doc;  
  };

  export const publishPresentation = async (id: string, payload: Partial<PresentationDocument>, userId: string) => {
    const doc = await PresentationModel.findById(id);
    if (!doc) throw new NotFoundException("Presentation not found");
    if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
    Object.assign(doc, payload);
    await doc.save();
    return doc;  
  };

  export const deletePresentation = async (id: string, userId: string) => {
    const doc = await PresentationModel.findById(id);
    if (!doc) throw new NotFoundException("Presentation not found");
    if (String(doc.createdBy) !== userId) throw new ForbiddenException("Not owner");
    await doc.deleteOne();
    return doc;  
  };

  export const getPresentations = async (query: { 
    q?: string; 
    topics?: string[]; 
    level?: string; 
    sort?: string; 
    page?: number; 
    limit?: number; 
    status?: string; 
  }) => {
    const { q, topics, level, sort = "new", page = 1, limit = 12, status } = query;
  
    const filter: any = {};
    if (status) filter.status = status;
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
      PresentationModel.find(filter)
        .sort(sortMap[sort] || sortMap.new)
        .skip(skip)
        .limit(limit),
      PresentationModel.countDocuments(filter),
    ]);
  
    const totalPages = Math.ceil(total / limit);
  
    return { items, total, page, limit, totalPages };
  };
  
  

  export const getPresentationById = async (id: string) => {
    const doc = await PresentationModel.findById(id);
    if (!doc) throw new NotFoundException("Presentation not found");
    return doc;
  };

  export const getPresentationContent =  async (presentationId: string) => {
    const pres = await PresentationModel.findById(presentationId);
    if (!pres) throw new NotFoundException("Presentation not found");
    let contentUrl: string | undefined;
    let posterUrl: string | undefined;
    if (pres.fileAssetId) {
      const asset = await LibraryAssetModel.findById(pres.fileAssetId);

// S3
      //   if (asset) {
      //   // //////////////////////////////////////////S3////////////////////////////////
      //   if (asset.objectKey) contentUrl = await getPresignedGetUrl(asset.objectKey);
      //   posterUrl = asset.urls.posterUrl;
      // }
    }
    PresentationModel.updateOne({ _id: pres._id }, { $inc: { "metrics.views": 1 } }).catch(() => {});
    return {
      id: String(pres._id),
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
  };
  