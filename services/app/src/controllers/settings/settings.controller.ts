import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  getUserSettingsService,
  resetUserSettingsService,
  updateUserSettingsService,
} from "../../services/settings/settings.service";

// ============ User Settings Controllers ============
export const getUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const settings = await getUserSettingsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings fetched successfully",
      data: settings,
    });
  }
);

export const updateUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const settings = await updateUserSettingsService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings updated successfully",
      data: settings,
    });
  }
);

export const resetUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const settings = await resetUserSettingsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Settings reset to default successfully",
      data: settings,
    });
  }
);