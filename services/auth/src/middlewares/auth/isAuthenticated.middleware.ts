import { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "../../utils/appError";
import { verifyAccessToken } from "../../utils/jwt";
import UserModel, { UserDocument } from "../../models/user.model";

declare global {
  namespace Express {
    interface Request {
      userD?: UserDocument;
      userId?: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Access token required");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException("Access token required");
    }

    const { payload, error } = verifyAccessToken(token);

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

    // Attach user to request
    req.user = user;
    req.userId = user._id!.toString();

    next();
  } catch (error) {
    next(error);
  }
};
