import BookModel from "../../models/library/book.model";
import FavoriteModel from "../../models/library/favorite.model";




export const createFavorite =  async (itemType: "BOOK"|"GUIDE"|"PRESENTATION", itemId: string, userId: string) => {
    await FavoriteModel.updateOne({ userId, itemType, itemId }, { $set: { userId, itemType, itemId } }, { upsert: true });

    if (itemType === "BOOK") {
      await BookModel.updateOne({ _id: itemId }, { $inc: { "metrics.favoritesCount": 1 } }).catch(() => {});
    }
    return { favorited: true };
  };


  export const deleteFavorite =  async (itemType: "BOOK"|"GUIDE"|"PRESENTATION", itemId: string, userId: string) => {
    await FavoriteModel.deleteOne({ userId, itemType, itemId });
    if (itemType === "BOOK") {
      await BookModel.updateOne({ _id: itemId }, { $inc: { "metrics.favoritesCount": -1 } }).catch(() => {});
    }
    return {favorited : false };
  };


  export const getMyFavorites = async (userId: string, type?: "BOOK"|"GUIDE"|"PRESENTATION") => {
    const filter: any = { userId };
    if (type) filter.itemType = type;
    const items = await FavoriteModel.find(filter).sort({ createdAt: -1 });
    return items.map(f => ({ itemType: f.itemType, itemId: String(f.itemId) }));
  };

  // Toggle favorite: if exists => remove and decrement, else => create and increment
  export const toggleFavorite = async (
    itemType: "BOOK" | "GUIDE" | "PRESENTATION",
    itemId: string,
    userId: string
  ) => {
    const existing = await FavoriteModel.findOne({ userId, itemType, itemId }).lean();
    if (existing) {
      await FavoriteModel.deleteOne({ userId, itemType, itemId });
      if (itemType === "BOOK") {
        await BookModel.updateOne({ _id: itemId }, { $inc: { "metrics.favoritesCount": -1 } }).catch(() => {});
      }
      return { favorited: false };
    } else {
      await FavoriteModel.updateOne(
        { userId, itemType, itemId },
        { $set: { userId, itemType, itemId } },
        { upsert: true }
      );
      if (itemType === "BOOK") {
        await BookModel.updateOne({ _id: itemId }, { $inc: { "metrics.favoritesCount": 1 } }).catch(() => {});
      }
      return { favorited: true };
    }
  };