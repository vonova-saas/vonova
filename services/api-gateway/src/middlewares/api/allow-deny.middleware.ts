import { NextFunction, Request, Response } from 'express';
import { Env } from '../../config/env.config';
import { HTTPSTATUS } from '../../config/http.config';

/**
 * Allow/Deny middleware for early request filtering.
 * - Allows only configured IPs/origins when allowlists are set.
 * - Blocks any configured blacklist entries.
 * - Optional API key enforcement via `x-api-key` if INTERNAL_API_SECRET_KEY is set.
 */
export function allowDenyMiddleware() {
  // Pre-parse lists from env (comma-separated)
  const allowIps = (Env.TRUSTED_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigins = (Env.CORS_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean);
  const denyOrigins = (Env.CORS_BLACKLIST || '').split(',').map(s => s.trim()).filter(Boolean);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || (req.connection as any).remoteAddress || '';
    const origin = (req.headers['origin'] as string) || '';

    // Deny by origin blacklist
    if (denyOrigins.length && origin && denyOrigins.includes(origin)) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({ error: 'Forbidden', reason: 'Origin blocked' });
    }

    // Allowlist checks (only enforce when lists provided)
    //ToDo: make this after use Vercel’s Outbound IPs
    // if (allowIps.length && !allowIps.includes(ip)) {
    //   return res.status(HTTPSTATUS.FORBIDDEN).json({ error: 'Forbidden', reason: 'IP not allowed' });
    // }

    if (allowOrigins.length && origin && !allowOrigins.includes(origin)) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({ error: 'Forbidden', reason: 'Origin not allowed' });
    }

    // Optional API key enforcement for internal-only access
    if (Env.INTERNAL_API_SECRET_KEY) {
      const apiKey = (req.headers['x-api-key'] as string) || '';
      // If client provides a key and it mismatches, block. If no key, allow public routes.
      if (apiKey && apiKey !== Env.INTERNAL_API_SECRET_KEY) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({ error: 'Unauthorized', reason: 'Invalid API key' });
      }
    }

    next();
  };
}
