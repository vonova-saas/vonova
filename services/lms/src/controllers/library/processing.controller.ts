import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { handleLibraryProcessingWebhookService } from "../../services/library/processing.service";

export const libraryProcessingWebhookController = asyncHandler(async (req: Request, res: Response) => {
  const result = await handleLibraryProcessingWebhookService(req.body);
  res.status(HTTPSTATUS.OK).json({ message: "Processing updated", data: result });
});
