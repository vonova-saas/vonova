import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  getUserAccountService,
  updateUserAccountService,
} from "../../services/settings/account.service";

// ============ User Account Controllers ============
export const getUserAccountController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const account = await getUserAccountService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User account fetched successfully",
      data: account,
    });
  }
);

export const updateUserAccountController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const account = await updateUserAccountService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User account updated successfully",
      data: account,
    });
  }
);
