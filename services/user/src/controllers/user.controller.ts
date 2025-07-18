import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getUserProfileService,
  updateUserProfileService,
  getUserSettingsService,
  updateUserSettingsService,
  getDashboardDataService,
  updateDashboardDataService,
} from "../services/user.service";
import UserProfileModel from "../models/userProfile.model";
import UserSettingsModel from "../models/userSettings.model";
import DashboardDataModel from "../models/dashboardData.model";
import { NotFoundException } from "../utils/appError";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const getUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const profile = await getUserProfileService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile fetched successfully",
      data: profile,
    });
  }
);

export const updateUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const profile = await updateUserProfileService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile updated successfully",
      data: profile,
    });
  }
);

export const getUserSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
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
    const settings = await updateUserSettingsService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User settings updated successfully",
      data: settings,
    });
  }
);

export const getDashboardDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const dashboard = await getDashboardDataService(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Dashboard data fetched successfully",
      data: dashboard,
    });
  }
);

export const updateDashboardDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const dashboard = await updateDashboardDataService(userId, req.body);
    return res.status(HTTPSTATUS.OK).json({
      message: "Dashboard data updated successfully",
      data: dashboard,
    });
  }
);

export const initUserDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, name, email } = req.body;
    if (!userId || !email) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "userId and email are required",
      });
    }


    // Create profile if not exists
    let profile = await UserProfileModel.findOne({ userId });
    if (!profile) {
      profile = await UserProfileModel.create({ userId, name, email });
    }
    // Create settings if not exists
    let settings = await UserSettingsModel.findOne({ userId });
    if (!settings) {
      settings = await UserSettingsModel.create({ userId });
    }
    // Create dashboard if not exists
    let dashboard = await DashboardDataModel.findOne({ userId });
    if (!dashboard) {
      dashboard = await DashboardDataModel.create({ userId });
    }
    return res.status(HTTPSTATUS.CREATED).json({
      message: "User data initialized",
      data: {
        profile,
        settings,
        dashboard,
      },
    });
  }
);
