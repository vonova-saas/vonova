import { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "../../utils/appError";
import { verifyAccessToken } from "../../utils/jwt";
import UserModel from "../../models/auth/user.model";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException("Access token required");
    }

    const { payload, error } = verifyAccessToken(accessToken);

    if (error || !payload) {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    // Verify user still exists and is active
    const user = await UserModel.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account has been deactivated");
    }

    // Attach to request with global types
    req.user = {
      id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    req.userDoc = user; // raw mongoose doc if needed
    req.userId = user._id!.toString();

    next();
  } catch (error) {
    next(error);
  }
};
