import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getUserSettingsService,
  updateUserSettingsService,
} from "../services/settings.service";
import { NotFoundException } from "../utils/appError";

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
    const userId = req.params.userId;
    const requesterId = req.user?.id;

    // Users can only access their own settings (unless admin)
    if (requesterId && requesterId !== userId && req.user?.role !== 'ADMIN') {
      throw new NotFoundException("You can only access your own settings");
    }

    const settings = await getUserSettingsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings fetched successfully",
      data: settings,
    });
  }
);

export const updateUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const requesterId = req.user?.id;

    // Users can only update their own settings (unless admin)
    if (requesterId && requesterId !== userId && req.user?.role !== 'ADMIN') {
      throw new NotFoundException("You can only update your own settings");
    }

    const settings = await updateUserSettingsService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings updated successfully",
      data: settings,
    });
  }
);
