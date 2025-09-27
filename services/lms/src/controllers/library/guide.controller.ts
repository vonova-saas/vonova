import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { createGuideService, deleteGuideService, getGuideByIdService, getGuideBySlugService, listGuidesService, publishGuideService, updateGuideService } from "../../services/library/guide.service";

export const createGuideController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await createGuideService(req.body, req.user!.id);
  res.status(HTTPSTATUS.CREATED).json({ message: "Guide created", data: doc });
});

export const updateGuideController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await updateGuideService(req.params.id, req.body, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Guide updated", data: doc });
});

export const publishGuideController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await publishGuideService(req.params.id, req.body.status, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Guide status updated", data: doc });
});

export const deleteGuideController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await deleteGuideService(req.params.id, req.user!.id);
  res.status(HTTPSTATUS.OK).json({ message: "Guide deleted", data: doc });
});

export const getGuideByIdController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await getGuideByIdService(req.params.id);
  res.status(HTTPSTATUS.OK).json({ message: "Guide", data: doc });
});

export const getGuideBySlugController = asyncHandler(async (req: Request, res: Response) => {
  const doc = await getGuideBySlugService(req.params.slug);
  res.status(HTTPSTATUS.OK).json({ message: "Guide", data: doc });
});

export const listGuidesController = asyncHandler(async (req: Request, res: Response) => {
  const { items, total, page, limit } = await listGuidesService({
    q: (req.query.q as string) || undefined,
    topics: req.query.topics ? String(req.query.topics).split(',') : undefined,
    level: (req.query.level as string) || undefined,
    sort: (req.query.sort as string) || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    status: (req.query.status as string) || undefined,
  });
  res.status(HTTPSTATUS.OK).json({ message: "Guides", data: { items, total, page, limit } });
});
