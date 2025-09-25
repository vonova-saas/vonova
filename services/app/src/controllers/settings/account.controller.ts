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

    // Use signed headers (injected by API Gateway) as defaults for lazy init
    const name = (req.headers["x-user-name"] as string) || "";
    const email = (req.headers["x-user-email"] as string) || "";

    const account = await getUserAccountService(userId, {
      name,
      email,
    });

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
