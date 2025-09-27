import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { getBookContentService, getMyBookProgressService, updateBookProgressService } from "../../services/library/reader.service";
import { addFavoriteService, listMyFavoritesService, removeFavoriteService } from "../../services/library/favorite.service";

export const getBookContentController = asyncHandler(async (req: Request, res: Response) => {
  const data = await getBookContentService(req.params.bookId, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Book content", data });
});

export const updateBookProgressController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await updateBookProgressService(
    req.params.bookId,
    req.user!.id,
    { lastPage: req.body.lastPage, timeSpentSec: req.body.timeSpentSec, completed: req.body.completed }
  );
  res.status(HTTPSTATUS.OK).json({ message: "Progress updated", data: doc });
});

export const getMyBookProgressController = asyncHandler(async (req: Request, res: Response) => {
  const data = await getMyBookProgressService(req.params.bookId, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "My progress", data });
});

export const addFavoriteController = asyncHandler(async (req: Request, res: Response) => {
  const data = await addFavoriteService(req.params.itemType as any, req.params.itemId, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Favorited", data });
});

export const removeFavoriteController = asyncHandler(async (req: Request, res: Response) => {
  const data = await removeFavoriteService(req.params.itemType as any, req.params.itemId, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Unfavorited", data });
});

export const listMyFavoritesController = asyncHandler(async (req: Request, res: Response) => {
  const data = await listMyFavoritesService(req.user!.id, req.query.type as any);
  res.status(HTTPSTATUS.OK).json({ message: "My favorites", data });
});
