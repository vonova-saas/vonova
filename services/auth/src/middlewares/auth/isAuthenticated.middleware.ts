import { Request, Response, NextFunction } from "express";
import { UnauthorizedException, ForbiddenException } from "../../utils/appError";
import { verifyAccessToken, AccessTPayload } from "../../utils/jwt";
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

export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedException("Authentication required");
  }

  // Type guard to ensure req.user has isVerified property
  if (typeof (req.user as any).isVerified !== "boolean") {
    throw new ForbiddenException("User verification status unknown");
  }

  if (!(req.user as any).isVerified) {
    throw new ForbiddenException("Email verification required");
  }

  next();
};

// export const requireRole = (roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       throw new UnauthorizedException("Authentication required");
//     }

//     if (!roles.includes(req.user.role)) {
//       throw new ForbiddenException("Insufficient permissions");
//     }

//     next();
//   };
// };

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const { payload } = verifyAccessToken(token);

    if (payload) {
      const user = await UserModel.findById(payload.userId);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id!.toString();
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't want to throw errors
    next();
  }
};