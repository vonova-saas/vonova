import { Request, Response, NextFunction } from "express";
import { Env } from "../../config/env.config";
import { UnauthorizedException } from "../../utils/appError";

/**
 * Ensures that the request is coming from a trusted internal caller (e.g., API Gateway).
 * - In production: requires header `x-internal-key` to match `Env.INTERNAL_API_KEY`.
 * - In non-production: if INTERNAL_API_KEY is set, it must match; if not set, allow for local/dev ease.
 */
export const requireInternalKey = (req: Request, _res: Response, next: NextFunction) => {
  const configuredKey = Env.INTERNAL_API_SECRET_KEY;
  const providedKey = (req.headers["x-internal-key"] as string) || "";

  const isProd = Env.NODE_ENV === "production";

  if (isProd) {
    if (!configuredKey || providedKey !== configuredKey) {
      return next(new UnauthorizedException("Unauthorized inter-service request"));
    }
    return next();
  }

  // Non-production behavior
  // If a key is configured, enforce it; otherwise, allow for developer convenience
  if (configuredKey) {
    if (providedKey !== configuredKey) {
      return next(new UnauthorizedException("Unauthorized inter-service request (dev)"));
    }
  }

  return next();
};
