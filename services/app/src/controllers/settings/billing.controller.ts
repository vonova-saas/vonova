import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  getUserBillingService,
  updateUserBillingService,
} from "../../services/settings/billing.service";

// ============ User Billing Controllers ============
export const getUserBillingController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const billing = await getUserBillingService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User billing fetched successfully",
      data: billing,
    });
  }
);

export const updateUserBillingController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const billing = await updateUserBillingService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User billing updated successfully",
      data: billing,
    });
  }
);
