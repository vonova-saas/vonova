import { Request, Response, NextFunction } from "express";
import { ForbiddenException, UnauthorizedException } from "../../utils/appError";

export const hasPermission = (required: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException("Authentication required"));
    }
    const perms = req.user.permissions || [];
    if (!perms.includes(required)) {
      return next(new ForbiddenException("Insufficient permissions"));
    }
    return next();
  };
};

export const hasAnyPermission = (requiredAny: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException("Authentication required"));
    }
    const perms = req.user.permissions || [];
    if (!requiredAny.some(p => perms.includes(p))) {
      return next(new ForbiddenException("Insufficient permissions"));
    }
    return next();
  };
};
