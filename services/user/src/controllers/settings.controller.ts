import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import * as settingsService from "../services/settings.service";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        isVerified: boolean;
      };
    }
  }
}

//! ============ User settings Controllers ============
export const getUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const settings = await settingsService.getUserSettingsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings fetched successfully",
      data: settings,
    });
  }
);

export const updateUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const settings = await settingsService.updateUserSettingsService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings updated successfully",
      data: settings,
    });
  }
);
