import mongoose, { Document, Schema, Types } from "mongoose";

export type AssetStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface AssetUrls {
  sourceUrl?: string; // s3 object url (optional, usually private)
  streamUrl?: string; // cdn or signed get (phase 3 can reuse source)
  posterUrl?: string;
  captionsUrl?: string;
}

export interface AssetDocument extends Document {
  ownerId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  provider: "S3";
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  size?: number;
  status: AssetStatus;
  urls: AssetUrls;
  processing?: { jobId?: string; error?: string };
  createdAt: Date;
  updatedAt: Date;
}

const urlsSchema = new Schema<AssetUrls>({
  sourceUrl: String,
  streamUrl: String,
  posterUrl: String,
  captionsUrl: String,
}, { _id: false });

const assetSchema = new Schema<AssetDocument>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
  provider: { type: String, default: "S3" },
  objectKey: { type: String, required: true },
  originalFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  status: { type: String, enum: ["PENDING","UPLOADING","UPLOADED","PROCESSING","READY","FAILED"], default: "PENDING" },
  urls: { type: urlsSchema, default: {} },
  processing: { jobId: String, error: String },
}, { timestamps: true });

assetSchema.index({ lessonId: 1 }, { unique: false });

const AssetModel = mongoose.model<AssetDocument>("Asset", assetSchema);
export default AssetModel;
