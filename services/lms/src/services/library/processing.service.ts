import LibraryAssetModel from "../../models/library/asset.model";
import BookModel from "../../models/library/book.model";
import GuideModel from "../../models/library/guide.model";
import PresentationModel from "../../models/library/presentation.model";
import { NotFoundException } from "../../utils/appError";

export const handleLibraryProcessingWebhookService = async (payload: {
  itemType: "BOOK"|"GUIDE"|"PRESENTATION";
  itemId: string;
  assetId: string;
  pageCount?: number;
  coverUrl?: string;
  previewThumbnails?: string[];
}) => {
  const asset = await LibraryAssetModel.findById(payload.assetId);
  if (!asset) throw new NotFoundException("Asset not found");

  asset.status = "READY";
  if (payload.coverUrl) asset.urls.posterUrl = payload.coverUrl;
  if (payload.previewThumbnails) asset.urls.previewThumbnails = payload.previewThumbnails;
  await asset.save();

  if (payload.itemType === "BOOK") {
    const update: any = {};
    if (payload.pageCount !== undefined) update.pageCount = payload.pageCount;
    if (payload.coverUrl) update.coverUrl = payload.coverUrl;
    await BookModel.findByIdAndUpdate(payload.itemId, update);
  }
  if (payload.itemType === "GUIDE") {
    const update: any = {};
    if (payload.coverUrl) update.coverUrl = payload.coverUrl;
    await GuideModel.findByIdAndUpdate(payload.itemId, update);
  }
  if (payload.itemType === "PRESENTATION") {
    const update: any = {};
    if (payload.coverUrl) update.coverUrl = payload.coverUrl;
    await PresentationModel.findByIdAndUpdate(payload.itemId, update);
  }

  return { success: true };
};
