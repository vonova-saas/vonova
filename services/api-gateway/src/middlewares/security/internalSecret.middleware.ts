import { Request, Response, NextFunction } from "express";
import { Env } from "../../config/env.config";
import { HTTPSTATUS } from "../../config/http.config";

/**
 * Validates an internal secret header for webhook/internal endpoints.
 * Clients must send header: `x-internal-secret: <Env.INTERNAL_API_SECRET_KEY>`
 */
export function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  const provided = req.header("x-internal-secret");
  if (!Env.INTERNAL_API_SECRET_KEY) {
    // If not configured, reject explicitly for safety
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Internal secret not configured" });
  }
  if (!provided || provided !== Env.INTERNAL_API_SECRET_KEY) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Invalid internal secret" });
  }
  return next();
}
