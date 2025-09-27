import { Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { completeLibraryFileService, presignLibraryFileService } from "../../services/library/upload.service";

export const presignLibraryFileController = asyncHandler(async (req: Request, res: Response) => {
  const { fileName, mimeType, size } = req.body as { fileName: string; mimeType: string; size: number };
  const result = await presignLibraryFileService(req.params.itemType as any, req.params.itemId, req.user!.id, fileName, mimeType, size);
  res.status(HTTPSTATUS.OK).json({ message: "Presigned URL created", data: result });
});

export const completeLibraryFileController = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, objectKey } = req.body as { assetId: string; objectKey: string };
  const result = await completeLibraryFileService(req.params.itemType as any, req.params.itemId, req.user!.id, assetId, objectKey);
  res.status(HTTPSTATUS.OK).json({ message: "Upload completed", data: result });
});
