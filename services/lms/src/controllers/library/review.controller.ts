import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { createOrUpdateLibraryReviewService, getMyLibraryReviewService, listLibraryReviewsService } from "../../services/library/review.service";

export const createOrUpdateLibraryReviewController = asyncHandler(async (req: Request, res: Response) => {
  const { rating, title, body } = req.body as { rating: number; title?: string; body?: string };
  const review = await createOrUpdateLibraryReviewService(req.params.itemType as any, req.params.itemId, req.user!.id, rating, title, body);
  res.status(HTTPSTATUS.OK).json({ message: "Review saved", data: review });
});

export const listLibraryReviewsController = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await listLibraryReviewsService(req.params.itemType as any, req.params.itemId, page, limit);
  res.status(HTTPSTATUS.OK).json({ message: "Reviews", data: result });
});

export const getMyLibraryReviewController = asyncHandler(async (req: Request, res: Response) => {
  const review = await getMyLibraryReviewService(req.params.itemType as any, req.params.itemId, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "My review", data: review });
});
