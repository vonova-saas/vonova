import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import * as profileService from "../services/profile.service";
import { BadRequestException } from "../utils/appError";

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

// ============ User Initial Controllers ============
export const initUserDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, name, email, role } = req.body;
    if (!userId || !email) {
      throw new BadRequestException("userId and email are required");
    }

    const result = await profileService.initUserDataService(userId, name, email, role);

    return res.status(HTTPSTATUS.OK).json({
      message: "User data initialized",
      data: {
        ...result
      },
    })
  }
);

//* ============ User profile Controllers ============
export const getUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const requesterId = req.user?.id;

    const profile = await profileService.getUserProfileService(userId, requesterId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile fetched successfully",
      data: profile,
    });
  }
);

export const getMyProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const profile = await profileService.getMyProfileService(userId!);
    return res.status(HTTPSTATUS.OK).json({
      message: "My profile fetched successfully",
      data: profile,
    });
  }
);




export const updateUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const profile = await profileService.updateUserProfileService(userId!, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile updated successfully",
      data: profile,
    });
  }
);

export const updateStudentInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const studentInfo = req.body;
    const updatedProfile = await profileService.updateStudentInfoService(userId, studentInfo);

    res.status(HTTPSTATUS.OK).json({
      message: "Student info updated",
      data: updatedProfile
    });
  }
);

export const updateInstructorInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const instructorInfo = req.body;
    const updatedProfile = await profileService.updateInstructorInfoService(userId, instructorInfo);

    res.status(HTTPSTATUS.OK).json({
      message: "Student info updated",
      data: updatedProfile
    });
  }
);

export const updateAdminInfoController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const adminInfo = req.body;
    const updatedProfile = await profileService.updateAdminInfoService(userId, adminInfo);

    res.status(HTTPSTATUS.OK).json({
      message: "Student info updated",
      data: updatedProfile
    });
  }
);
