import mongoose, { Document, Schema, Types } from "mongoose";

export type LibraryAssetStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface LibraryAssetUrls {
  sourceUrl?: string;
  streamUrl?: string;
  posterUrl?: string;
  previewThumbnails?: string[];
}

export interface LibraryAssetDocument extends Document {
  ownerId: Types.ObjectId;
  itemType: "BOOK" | "GUIDE" | "PRESENTATION";
  itemId: Types.ObjectId;
  provider: "S3" | "BUNNY";
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  size?: number;
  status: LibraryAssetStatus;
  urls: LibraryAssetUrls;
  createdAt: Date;
  updatedAt: Date;
}

const urlsSchema = new Schema<LibraryAssetUrls>({
  sourceUrl: String,
  streamUrl: String,
  posterUrl: String,
  previewThumbnails: { type: [String], default: [] },
}, { _id: false });

const assetSchema = new Schema<LibraryAssetDocument>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  itemType: { type: String, enum: ["BOOK", "GUIDE", "PRESENTATION"], required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, required: true, index: true },
  provider: { type: String, default: "S3" },
  objectKey: { type: String, required: true },
  originalFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  status: { type: String, enum: ["PENDING", "UPLOADING", "UPLOADED", "PROCESSING", "READY", "FAILED"], default: "PENDING" },
  urls: { type: urlsSchema, default: {} },
}, { timestamps: true });

assetSchema.index({ itemType: 1, itemId: 1 });

const LibraryAssetModel = mongoose.model<LibraryAssetDocument>("LibraryAsset", assetSchema);
export default LibraryAssetModel;
