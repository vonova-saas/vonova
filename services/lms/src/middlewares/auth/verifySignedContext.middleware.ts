import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Env } from "../../config/env.config";
import { UnauthorizedException } from "../../utils/appError";
import { isAuthenticated } from "./isAuthenticated.middleware";

const HEADER_USER_ID = "x-user-id";
const HEADER_USER_ROLE = "x-user-role";
const HEADER_USER_PERMS = "x-user-permissions";
const HEADER_TS = "x-ctx-ts";
const HEADER_SIG = "x-ctx-sig";

function verifySignature(req: Request) {
  const userId = (req.headers[HEADER_USER_ID] as string) || "";
  const role = (req.headers[HEADER_USER_ROLE] as string) || "";
  const perms = (req.headers[HEADER_USER_PERMS] as string) || "";
  const ts = (req.headers[HEADER_TS] as string) || "";
  const sig = (req.headers[HEADER_SIG] as string) || "";

  if (!userId || !role || !perms || !ts || !sig) {
    return { ok: false, reason: "missing_headers" as const };
  }

  const skew = Number(Env.SIGNED_CONTEXT_SKEW_SECONDS || 120);
  const nowSec = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > skew) {
    return { ok: false, reason: "expired" as const };
  }

  const payload = `${userId}|${role}|${perms}|${ts}`;
  const hmac = crypto
    .createHmac("sha256", Env.LMS_SIGNING_SECRET || "")
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig))) {
    return { ok: false, reason: "invalid_signature" as const };
  }

  return { ok: true as const, userId, role, perms: perms.split(",").filter(Boolean) };
}

export const isAuthenticatedOrSignedContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const trustSigned = (Env.TRUST_SIGNED_CONTEXT || "false").toLowerCase() === "true";

    // Try signed context first
    const verified = verifySignature(req);
    if (verified.ok) {
      req.user = {
        id: verified.userId,
        name: (req.headers["x-user-name"] as string) || "",
        email: (req.headers["x-user-email"] as string) || "",
        role: verified.role,
        isActive: true,
        isVerified: true,
        permissions: verified.perms,
      } as any;
      return next();
    }

    // If we require signed context in this environment, reject
    if (trustSigned) {
      throw new UnauthorizedException("Invalid or missing signed auth context");
    }

    // Fallback to standard authentication using App service
    return isAuthenticated(req, res, next);
  } catch (err) {
    return next(err);
  }
};
