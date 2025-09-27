import BookModel from "../../models/library/book.model";
import LibraryAssetModel from "../../models/library/asset.model";
import BookProgressModel from "../../models/library/bookProgress.model";
import { NotFoundException } from "../../utils/appError";
import { getPresignedGetUrl } from "../storage/s3.service";
import GuideModel from "../../models/library/guide.model";
import PresentationModel from "../../models/library/presentation.model";

export const getBookContentService = async (bookId: string, userId: string) => {
  const book = await BookModel.findById(bookId);
  if (!book) throw new NotFoundException("Book not found");

  // Resolve asset and produce signed GET url for PDF
  let pdfUrl: string | undefined;
  if (book.fileAssetId) {
    const asset = await LibraryAssetModel.findById(book.fileAssetId);
    if (asset && asset.objectKey) {
      pdfUrl = await getPresignedGetUrl(asset.objectKey);
    }
  }

  // Increment views (fire-and-forget)
  BookModel.updateOne({ _id: book._id }, { $inc: { "metrics.views": 1 } }).catch(() => {});

  // Fetch current progress (optional)
  const progress = await BookProgressModel.findOne({ userId, bookId: book._id });

  return {
    id: String(book._id),
    title: book.title,
    summary: book.summary,
    description: book.description,
    authors: book.authors,
    topics: book.topics,
    level: book.level,
    coverUrl: book.coverUrl,
    language: book.language,
    pageCount: book.pageCount,
    readingTimeMin: book.readingTimeMin,
    pdfUrl,
    progress: progress ? { lastPage: progress.lastPage, completed: progress.completed } : undefined,
  };
};

export const updateBookProgressService = async (
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

export const getMyBookProgressService = async (bookId: string, userId: string) => {
  const doc = await BookProgressModel.findOne({ userId, bookId });
  return doc ? { lastPage: doc.lastPage, timeSpentSec: doc.timeSpentSec, completed: doc.completed } : { lastPage: 0, timeSpentSec: 0, completed: false };
};

export const getGuideContentService = async (guideId: string) => {
  const guide = await GuideModel.findById(guideId);
  if (!guide) throw new NotFoundException("Guide not found");
  let contentUrl: string | undefined;
  if (guide.fileAssetId) {
    const asset = await LibraryAssetModel.findById(guide.fileAssetId);
    if (asset && asset.objectKey) {
      contentUrl = await getPresignedGetUrl(asset.objectKey);
    }
  }
  GuideModel.updateOne({ _id: guide._id }, { $inc: { "metrics.views": 1 } }).catch(() => {});
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

export const getPresentationContentService = async (presentationId: string) => {
  const pres = await PresentationModel.findById(presentationId);
  if (!pres) throw new NotFoundException("Presentation not found");
  let contentUrl: string | undefined;
  let posterUrl: string | undefined;
  if (pres.fileAssetId) {
    const asset = await LibraryAssetModel.findById(pres.fileAssetId);
    if (asset) {
      if (asset.objectKey) contentUrl = await getPresignedGetUrl(asset.objectKey);
      posterUrl = asset.urls.posterUrl;
    }
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
