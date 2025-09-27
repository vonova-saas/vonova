import BookModel, { BookDocument } from "../../models/library/book.model";
import BookProgressModel from "../../models/library/bookProgress.model";
import { ForbiddenException, NotFoundException } from "../../utils/appError";



export const createBook = async (payload: Partial<BookDocument>, userId: string) => {
    const doc = await BookModel.create({ ...payload, createdBy: userId });
    return doc;
  };



  export const updateBook = async (id: string, payload: Partial<BookDocument>, userId: string) => {
    const book = await BookModel.findById(id);
    if (!book) {
      throw new NotFoundException("Book not found");
    }
    if (book.createdBy.toString() !== userId) {
      throw new ForbiddenException("You are not authorized to update this book");
    }
    const updatedBook = await BookModel.findByIdAndUpdate(id, payload, { new: true ,runValidators: true});
    return updatedBook;
  };


  export const publishBook = async (id: string, payload: Partial<BookDocument>, userId: string) => {
    const book = await BookModel.findById(id);
    if (!book) {
      throw new NotFoundException("Book not found");
    }
    if (book.createdBy.toString() !== userId) {
      throw new ForbiddenException("You are not authorized to publish this book");
    }
    const updatedBook = await BookModel.findByIdAndUpdate(id, payload, { new: true ,runValidators: true});
    return updatedBook;
  };

  export const deleteBook = async (id: string, userId: string) => {
    const book = await BookModel.findById(id);
    if (!book) {
      throw new NotFoundException("Book not found");
    }
    if (book.createdBy.toString() !== userId) {
      throw new ForbiddenException("You are not authorized to delete this book");
    }
    const deletedBook = await BookModel.findByIdAndDelete(id);
    return deletedBook;
  };


  export const getBooks = async (query: { 
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
      BookModel.find(filter).sort(sortMap[sort] || sortMap.new).skip(skip).limit(limit),
      BookModel.countDocuments(filter),
    ]);
  
    const totalPages = Math.ceil(total / limit);
  
    return { items, total, page, limit, totalPages };
  };
  
  


  export const getBookById = async (id: string) => {
    const book = await BookModel.findById(id);
    if (!book) {
      throw new NotFoundException("Book not found");
    }
    return book;
  };

  export const updateBookProgress = async (
    bookId: string,
    userId: string,
    payload: { lastPage: number; timeSpentSec?: number; completed?: boolean }
  ) => {
    const book = await BookModel.findById(bookId);
    if (!book) throw new NotFoundException("Book not found");
  
    const update: any = { lastPage: payload.lastPage };
    if (payload.timeSpentSec) update.$inc = { timeSpentSec: payload.timeSpentSec };
    if (payload.completed !== undefined) {
      update.completed = payload.completed;
      update.completedAt = payload.completed ? new Date() : undefined;
    }
  
    const doc = await BookProgressModel.findOneAndUpdate(
      { userId, bookId },
      { $set: { lastPage: payload.lastPage, completed: !!payload.completed, completedAt: payload.completed ? new Date() : undefined }, $inc: { timeSpentSec: payload.timeSpentSec || 0 } },
      { new: true, upsert: true }
    );
  
    return doc;
  };


  export const getMyBookProgress = async (bookId: string, userId: string) => {
    const doc = await BookProgressModel.findOne({ userId, bookId });
    return doc ? { lastPage: doc.lastPage, timeSpentSec: doc.timeSpentSec, completed: doc.completed } : { lastPage: 0, timeSpentSec: 0, completed: false };
  };

  export const getBookBySlug = async (slug: string) => {
    const doc = await BookModel.findOne({ slug });
    if (!doc) throw new NotFoundException("Book not found");
    return doc;
  };

  ////////////////////////////////////S3/////////////////////////////////////////////
  // export const getGuideContentService = async (guideId: string) => {
  //   const guide = await GuideModel.findById(guideId);
  //   if (!guide) throw new NotFoundException("Guide not found");
  //   let contentUrl: string | undefined;
  //   if (guide.fileAssetId) {
  //     const asset = await LibraryAssetModel.findById(guide.fileAssetId);
  //     if (asset && asset.objectKey) {
  //       contentUrl = await getPresignedGetUrl(asset.objectKey);
  //     }
  //   }
  //   GuideModel.updateOne({ _id: guide._id }, { $inc: { "metrics.views": 1 } }).catch(() => {});
  //   return {
  //     id: String(guide._id),
  //     title: guide.title,
  //     summary: guide.summary,
  //     description: guide.description,
  //     authors: guide.authors,
  //     topics: guide.topics,
  //     level: guide.level,
  //     coverUrl: guide.coverUrl,
  //     language: guide.language,
  //     contentUrl,
  //   };
  // };
  