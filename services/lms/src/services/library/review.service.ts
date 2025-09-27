import LibraryReviewModel from "../../models/library/review.model";
import BookModel from "../../models/library/book.model";
import GuideModel from "../../models/library/guide.model";
import PresentationModel from "../../models/library/presentation.model";
import { NotFoundException } from "../../utils/appError";
import { Types } from "mongoose";

export type LibraryItemType = "BOOK" | "GUIDE" | "PRESENTATION";

export const createOrUpdateLibraryReviewService = async (
  itemType: LibraryItemType,
  itemId: string,
  userId: string,
  rating: number,
  title?: string,
  body?: string
) => {
  await ensureItemExists(itemType, itemId);

  const review = await LibraryReviewModel.findOneAndUpdate(
    { userId, itemType, itemId },
    { $set: { rating, title, body } },
    { new: true, upsert: true }
  );

  await recomputeLibraryItemRatingAggregate(itemType, itemId);
  return review;
};

export const listLibraryReviewsService = async (itemType: LibraryItemType, itemId: string, page = 1, limit = 20) => {
  await ensureItemExists(itemType, itemId);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    LibraryReviewModel.find({ itemType, itemId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LibraryReviewModel.countDocuments({ itemType, itemId }),
  ]);
  return { items, total, page, limit };
};

export const getMyLibraryReviewService = async (itemType: LibraryItemType, itemId: string, userId: string) => {
  await ensureItemExists(itemType, itemId);
  const review = await LibraryReviewModel.findOne({ itemType, itemId, userId });
  if (!review) throw new NotFoundException("Review not found");
  return review;
};

export const recomputeLibraryItemRatingAggregate = async (itemType: LibraryItemType, itemId: string) => {
  const agg = await LibraryReviewModel.aggregate([
    { $match: { itemType, itemId: new Types.ObjectId(itemId) } },
    { $group: { _id: "$itemId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const ratingAverage = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0;
  const ratingCount = agg[0]?.count || 0;

  const update = { $set: { "metrics.ratingAverage": ratingAverage, "metrics.ratingCount": ratingCount } } as const;
  if (itemType === "BOOK") await BookModel.updateOne({ _id: itemId }, update);
  if (itemType === "GUIDE") await GuideModel.updateOne({ _id: itemId }, update);
  if (itemType === "PRESENTATION") await PresentationModel.updateOne({ _id: itemId }, update);

  return { ratingAverage, ratingCount };
};

async function ensureItemExists(itemType: LibraryItemType, itemId: string) {
  let exists: any = null;
  if (itemType === "BOOK") exists = await BookModel.findById(itemId);
  if (itemType === "GUIDE") exists = await GuideModel.findById(itemId);
  if (itemType === "PRESENTATION") exists = await PresentationModel.findById(itemId);
  if (!exists) throw new NotFoundException("Item not found");
}
