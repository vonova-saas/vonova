import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import * as FavoriteService from "../../services/library/favorite.service";

export const createFavorite = asyncHandler(async (req: Request, res: Response) => {
  const result = await FavoriteService.toggleFavorite(req.params.itemType as any, req.params.itemId, req.user!.id)
  res.status(HTTPSTATUS.OK).json({
    message: result.favorited ? "Favorite created successfully" : "Favorite deleted successfully",
    data: result
  })
})

export const getMyFavorites = asyncHandler(async (req: Request, res: Response) => {
  const data = await FavoriteService.getMyFavorites(req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "My favorites", data });
});

export const deleteFavorite = asyncHandler(async (req: Request, res: Response) => {
  const data = await FavoriteService.deleteFavorite(req.params.itemType as any, req.params.itemId, req.user!.id)
  res.status(HTTPSTATUS.OK).json({
    message: "Favorite deleted successfully",
    data
  })
})
