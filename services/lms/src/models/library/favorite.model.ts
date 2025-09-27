import mongoose, { Document, Schema, Types } from "mongoose";

export interface FavoriteDocument extends Document {
  userId: Types.ObjectId;
  itemType: "BOOK" | "GUIDE" | "PRESENTATION";
  itemId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: { type: String, enum: ["BOOK","GUIDE","PRESENTATION"], required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, required: true, index: true },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const FavoriteModel = mongoose.model<FavoriteDocument>("LibraryFavorite", favoriteSchema);
export default FavoriteModel;
