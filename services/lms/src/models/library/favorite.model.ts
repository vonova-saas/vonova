import mongoose, { Document, Schema } from "mongoose";

export interface FavoriteDocument extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  itemType: "BOOK" | "GUIDE" | "PRESENTATION";
  itemId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ["BOOK", "GUIDE", "PRESENTATION"],
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const FavoriteModel = mongoose.model<FavoriteDocument>("LibraryFavorite", favoriteSchema);
export default FavoriteModel;
