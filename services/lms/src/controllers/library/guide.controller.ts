import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { createGuideService, deleteGuideService, getGuideByIdService, getGuideBySlugService, getGuideContentService, listGuidesService, publishGuideService, updateGuideService } from "../../services/library/guide.service";

export const createGuideController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await createGuideService(req.body, req.user!.id);

    res.status(HTTPSTATUS.CREATED).json({
      message: "Material guide created successfully",
      data: guide
    });
  }
);

export const publishGuideController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await publishGuideService(req.params.id, req.body.status, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide status updated successfully",
      data: guide
    });
  }
);

export const listGuidesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { items, total, page, limit } = await listGuidesService({
      q: (req.query.q as string) || undefined,
      topics: req.query.topics ? String(req.query.topics).split(',') : undefined,
      level: (req.query.level as string) || undefined,
      sort: (req.query.sort as string) || undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: (req.query.status as string) || undefined,
    });

    res.status(HTTPSTATUS.OK).json({
      message: "Material guides retrieved successfully",
      data: { items, total, page, limit }
    });
  }
);

export const getGuideByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await getGuideByIdService(req.params.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide retrieved successfully",
      data: guide
    });
  }
);

export const getGuideBySlugController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await getGuideBySlugService(req.params.slug);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide retrieved successfully",
      data: guide
    });
  }
);

export const getGuideContentController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await getGuideContentService(req.params.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide content retrieved successfully",
      data: guide
    });
  }
);

export const updateGuideController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await updateGuideService(req.params.id, req.body, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide updated successfully",
      data: guide
    });
  }
);

export const deleteGuideController = asyncHandler(
  async (req: Request, res: Response) => {
    const guide = await deleteGuideService(req.params.id, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Material guide deleted successfully",
      data: guide
    });
  }
);

