import { Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import {
  addUserSupportMessageService,
  addUserSupportService,
  deleteUserSupportService,
  getUserSupportByIdService,
  getUserSupportMessagesService,
  getUserSupportsService,
  updateUserSupportService,
  updateUserSupportStatusService
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

//* ==================== Support Messages User Side Controllers ====================
export const addUserSupportMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const messages = await addUserSupportMessageService(userId, id, req.body.message, 'user');

    return res.status(HTTPSTATUS.OK).json({
      message: "Message added successfully",
      data: messages,
    });
  }
);

export const getUserSupportMessagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const messages = await getUserSupportMessagesService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Messages fetched successfully",
      data: messages,
    });
  }
);

export const updateUserSupportStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const updated = await updateUserSupportStatusService(userId, id, req.body.status);

    return res.status(HTTPSTATUS.OK).json({
      message: "Status updated successfully",
      data: updated,
    });
  }
);