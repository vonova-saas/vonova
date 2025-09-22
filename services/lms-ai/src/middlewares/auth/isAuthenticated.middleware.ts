import { Request, Response, NextFunction } from "express";
import { authServiceClient } from "../../utils/service-communication";
import { UnauthorizedException } from "../../utils/appError";

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
        permissions?: string[];
      };
    }
  }
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException("Access token required");
    }

    // Verify token with auth service
    const result = await authServiceClient.verifyToken(accessToken);

    if (!result || !result.valid) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Attach user info to request
    req.user = { ...result.user, id: result.user.userId || result.user.id, permissions: result.permissions } as any;

    next();
  } catch (error) {
    next(error);
  }
};
