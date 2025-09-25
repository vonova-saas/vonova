import { NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { config } from "../../config/gateway.config";

// Basic HTTP method allowlist
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

// Safe path check: prevent path traversal and illegal characters
function isSafePath(path: string): boolean {
  // Disallow traversal, control chars and sequences like '//' collapse issues
  if (!path) return true; // root is fine
  if (path.includes("..")) return false;
  if (path.includes("\\")) return false; // backslashes
  if (path.includes("//")) return false; // double slash
  // Only allow URL-safe: alphanum, - _ / . @ : ,
  return /^[A-Za-z0-9_\-\./:@,]*$/.test(path);
}

// Content-Type allowlist for bodies
const ALLOWED_CONTENT_TYPES = [
  "application/json",
  "multipart/form-data",
  "application/x-www-form-urlencoded",
];

export function validateForwardParams(serviceNameKey?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1) Method allowlist
      if (!ALLOWED_METHODS.has(req.method)) {
        return res.status(HTTPSTATUS.METHOD_NOT_ALLOWED).json({
          error: "Method Not Allowed",
          allowed: Array.from(ALLOWED_METHODS),
        });
      }

      // 2) Service validation (if provided) else derive from route
      const serviceName = serviceNameKey || (req.params as any).service;
      if (!serviceName || !config.services[serviceName as keyof typeof config.services]) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
          error: "Service Not Found",
          service: serviceName,
        });
      }

      // 3) Validate downstream path param (Express wildcard stored in req.params[0])
      const subPath = (req.params as any)[0] || "";
      if (!isSafePath(subPath)) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
          error: "Invalid Path",
          reason: "Unsafe path segment detected",
        });
      }

      // 4) Content-Type allowlist for requests with bodies
      const ct = (req.headers["content-type"] as string) || "";
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const ok = ALLOWED_CONTENT_TYPES.some((t) => ct.includes(t));
        if (ct && !ok) {
          return res.status(HTTPSTATUS.UNSUPPORTED_MEDIA_TYPE).json({
            error: "Unsupported Media Type",
            allowed: ALLOWED_CONTENT_TYPES,
          });
        }
      }

      // 5) Basic header size guard (optional, light)
      const headerBytes = Object.entries(req.headers)
        .reduce((acc, [k, v]) => acc + Buffer.byteLength(String(k)) + Buffer.byteLength(String(v ?? "")), 0);
      if (headerBytes > 16 * 1024) { // 16KB
        return res.status(HTTPSTATUS.REQUEST_HEADER_FIELDS_TOO_LARGE).json({
          error: "Request Header Fields Too Large",
        });
      }

      return next();
    } catch (err) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ error: "Invalid Request" });
    }
  };
}
