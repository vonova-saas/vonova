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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Access token is required");
    }

    const token = authHeader.split(" ")[1];

    // Verify token with auth service
    const result = await authServiceClient.verifyToken(token);

    if (!result || !result.valid) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Attach user info to request
    req.user = result.user;

    next();
  } catch (error) {
    next(error);
  }
}; 