import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { UnauthorizedException } from "../../utils/appError";
import { HTTPSTATUS } from "../../config/http.config";
import { getCurrentUserService } from "../../services/user/user.service";

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException("Missing or invalid access token");
    }

    const user = await getCurrentUserService(accessToken);

    return res.status(HTTPSTATUS.OK).json({
      message: "Current user fetched successfully",
      user: user.user,
    })
  }
);
