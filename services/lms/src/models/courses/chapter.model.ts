import mongoose, { Document, Schema, Types } from "mongoose";

export interface ChapterDocument extends Document {
  courseId: Types.ObjectId;
  title: string;
  index: number;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<ChapterDocument>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  title: { type: String, required: true },
  index: { type: Number, required: true, default: 0 },
}, { timestamps: true });

chapterSchema.index({ courseId: 1, index: 1 }, { unique: false });

const ChapterModel = mongoose.model<ChapterDocument>("Chapter", chapterSchema);
export default ChapterModel;
