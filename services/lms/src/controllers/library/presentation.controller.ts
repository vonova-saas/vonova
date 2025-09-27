import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import * as presentationService from "../../services/library/presentation.service";





export const createPresentation = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.createPresentation(req.body, req.user!.id);
    res.status(HTTPSTATUS.CREATED).json({ message: "Presentation created", data: doc });
  });


  export const updatePresentation = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.updatePresentation(req.params.id, req.body, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Presentation updated", data: doc });
  });

  export const publishPresentation = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.publishPresentation(req.params.id, req.body, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Presentation published", data: doc });
  });

  export const deletePresentation = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.deletePresentation(req.params.id, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Presentation deleted", data: doc });
  });

  export const getPresentations = asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit, totalPages } = await presentationService.getPresentations({
      q: req.query.q as string,
      topics: req.query.topics ? String(req.query.topics).split(',') : undefined,
      level: req.query.level as string,
      sort: req.query.sort as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      status: req.query.status as string,
    });
  
    res.status(HTTPSTATUS.OK).json({
      message: "Presentations fetched",
      data: { items, total, page, limit, totalPages },
    });
  });
  
  

  export const getPresentationById = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.getPresentationById(req.params.id);
    res.status(HTTPSTATUS.OK).json({ message: "Presentation fetched", data: doc });
  });

  export const getPresentationContent = asyncHandler(async (req: Request, res: Response) => {
    const doc = await presentationService.getPresentationContent(req.params.presentationId);
    res.status(HTTPSTATUS.OK).json({ message: "Presentation content fetched", data: doc });
  });