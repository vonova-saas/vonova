import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  getUserNotificationService,
  resetUserNotificationService,
  updateUserNotificationService,
} from "../../services/settings/notification.service";

// ============ User Notification Controllers ============
export const getUserNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const notification = await getUserNotificationService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User notification fetched successfully",
      data: notification,
    });
  }
);

export const updateUserNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const notification = await updateUserNotificationService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User notification updated successfully",
      data: notification,
    });
  }
);

export const resetUserNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const notification = await resetUserNotificationService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Notification reset to default successfully",
      data: notification,
    });
  }
);