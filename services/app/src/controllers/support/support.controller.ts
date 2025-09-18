import { Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import {
  addUserSupportService,
  deleteUserSupportService,
  getUserSupportByIdService,
  getUserSupportsService,
  updateUserSupportService
} from "../../services/support/support.service";

// ============ User Support Controllers ============
export const addUserSupportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const support = await addUserSupportService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User support added successfully",
      data: support,
    });
  }
);

export const getUserSupportsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const supports = await getUserSupportsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User supports fetched successfully",
      data: supports,
    });
  }
);

export const getUserSupportByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const support = await getUserSupportByIdService(userId, req.params.id);

    return res.status(HTTPSTATUS.OK).json({
      message: "User support fetched successfully",
      data: support,
    });
  }
);

export const updateUserSupportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const support = await updateUserSupportService(userId, req.params.id, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User support updated successfully",
      data: support,
    });
  }
);

export const deleteUserSupportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const support = await deleteUserSupportService(userId, req.params.id);

    return res.status(HTTPSTATUS.OK).json({
      message: support,
    });
  }
);