import { ForbiddenException, NotFoundException } from "../../utils/appError";
import { generateObjectKey, getPresignedPutUrl, headObjectExists } from "../storage/s3.service";
import LibraryAssetModel from "../../models/library/asset.model";
import BookModel from "../../models/library/book.model";
import GuideModel from "../../models/library/guide.model";
import PresentationModel from "../../models/library/presentation.model";

export const presignLibraryFileService = async (
  itemType: "BOOK"|"GUIDE"|"PRESENTATION",
  itemId: string,
  ownerId: string,
  fileName: string,
  mimeType: string,
  size: number
) => {
  const { exists, owner, model } = await ensureOwnerAndGetModel(itemType, itemId, ownerId);
  const objectKey = generateObjectKey(itemId, itemId, fileName); // reuse helper; path: courses/<id>/lessons/<id>/...
  const uploadUrl = await getPresignedPutUrl(objectKey, mimeType);

  const asset = await LibraryAssetModel.create({
    ownerId,
    itemType,
    itemId: model._id,
    objectKey,
    originalFileName: fileName,
    mimeType,
    size,
    status: "UPLOADING",
    provider: "S3",
    urls: { sourceUrl: `s3://${objectKey}` },
  });

  return { uploadUrl, assetId: asset.id, objectKey };
};

export const completeLibraryFileService = async (
  itemType: "BOOK"|"GUIDE"|"PRESENTATION",
  itemId: string,
  ownerId: string,
  assetId: string,
  objectKey: string
) => {
  await ensureOwnerAndGetModel(itemType, itemId, ownerId);

  const exists = await headObjectExists(objectKey);
  if (!exists) throw new NotFoundException("Uploaded object not found in bucket");

  const asset = await LibraryAssetModel.findById(assetId);
  if (!asset) throw new NotFoundException("Asset not found");

  asset.status = "UPLOADED";
  asset.urls.streamUrl = asset.urls.sourceUrl;
  await asset.save();

  // Link to item
  if (itemType === "BOOK") await BookModel.findByIdAndUpdate(itemId, { fileAssetId: asset._id });
  if (itemType === "GUIDE") await GuideModel.findByIdAndUpdate(itemId, { fileAssetId: asset._id });
  if (itemType === "PRESENTATION") await PresentationModel.findByIdAndUpdate(itemId, { fileAssetId: asset._id });

  return { assetId: asset.id, itemId };
};

async function ensureOwnerAndGetModel(itemType: "BOOK"|"GUIDE"|"PRESENTATION", itemId: string, ownerId: string) {
  let model: any = null;
  if (itemType === "BOOK") model = await BookModel.findById(itemId);
  if (itemType === "GUIDE") model = await GuideModel.findById(itemId);
  if (itemType === "PRESENTATION") model = await PresentationModel.findById(itemId);
  if (!model) throw new NotFoundException("Item not found");
  if (String(model.createdBy) !== ownerId) throw new ForbiddenException("Not owner of item");
  return { exists: true, owner: ownerId, model };
}
