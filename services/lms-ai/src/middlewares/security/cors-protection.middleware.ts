import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Env } from "../../config/env.config";
import { logSecurityEvent } from '../../services/securityLogger.service';

/**
 * CORS Protection Configuration
 */
export interface CORSConfig {
  origin?: string | string[] | RegExp[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  whitelist?: string[];
  blacklist?: string[];
  enableSecurityHeaders?: boolean;
  logger?: (msg: string, meta?: any) => void;
}

const DEFAULT_CONFIG: Required<CORSConfig> = {
  origin: Env.CORS_ORIGIN,
  methods: (Env.CORS_METHODS).split(','),
  allowedHeaders: (Env.CORS_ALLOWED_HEADERS).split(','),
  exposedHeaders: (Env.CORS_EXPOSED_HEADERS).split(',').filter(Boolean),
  credentials: Env.CORS_CREDENTIALS === 'true',
  maxAge: parseInt(Env.CORS_MAX_AGE, 10),
  whitelist: (Env.CORS_WHITELIST || '').split(',').map(origin => origin.trim()).filter(Boolean),
  blacklist: (Env.CORS_BLACKLIST || '').split(',').filter(Boolean),
  enableSecurityHeaders: Env.CORS_SECURITY_HEADERS !== 'false',
  logger: (msg, meta) => console.warn(`[CORS] ${msg}`, meta),
};

// Rate limiting for preflight requests
const preflightStore = new Map<string, { count: number; lastRequest: number }>();

/**
 * Validates origin against whitelist/blacklist and patterns
 */
function validateOrigin(origin: string, config: Required<CORSConfig>): boolean {
  // Special case: allow Swagger docs access from same origin
  if (origin === 'http://localhost:4000' || origin === 'https://localhost:4001') {
    return true;
  }

  // Check blacklist first
  if (config.blacklist.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(origin);
  })) {
    console.log(`[CORS] Origin ${origin} blocked by blacklist`);
    return false;
  }

  // Check whitelist if specified
  if (config.whitelist.length > 0) {
    const isWhitelisted = config.whitelist.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(origin);
    });
    console.log(`[CORS] Origin ${origin} whitelist check: ${isWhitelisted}`);
    return isWhitelisted;
  }

  // If no whitelist, allow all (except blacklisted)
  console.log(`[CORS] Origin ${origin} allowed (no whitelist specified)`);
  return true;
}

/**
 * Adds security headers beyond CORS
 */
function addSecurityHeaders(res: Response, config: Required<CORSConfig>): void {
  if (!config.enableSecurityHeaders) return;

  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

  // Strict Transport Security (only for HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * Rate limits preflight requests
 */
function checkPreflightRateLimit(origin: string, config: Required<CORSConfig>): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxPreflights = 10; // Max preflight requests per minute

  let data = preflightStore.get(origin);
  if (!data) {
    data = { count: 0, lastRequest: now };
    preflightStore.set(origin, data);
  }

  // Reset counter if window expired
  if (now - data.lastRequest > windowMs) {
    data.count = 1;
    data.lastRequest = now;
  } else {
    data.count++;
  }

  return data.count <= maxPreflights;
}

/**
 * Creates CORS protection middleware with enhanced security
 * @param userConfig Optional configuration overrides
 */
export function createCORSProtectionMiddleware(userConfig: CORSConfig = {}): RequestHandler {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('Origin');
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      // Rate limit preflight requests
      if (origin && !checkPreflightRateLimit(origin, config)) {
        config.logger('Preflight rate limit exceeded', { origin });
        logSecurityEvent({
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          method: req.method,
          route: req.originalUrl || req.path,
          attackType: 'CORS Preflight Rate Limit',
          details: { origin }
        });
        res.status(429).json({ error: 'Too many preflight requests', errorCode: 'CORS_PREFLIGHT_LIMIT' });
        return;
      }

      // Validate origin for preflight
      if (origin && !validateOrigin(origin, config)) {
        config.logger('Preflight blocked for origin', { origin });
        logSecurityEvent({
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          method: req.method,
          route: req.originalUrl || req.path,
          attackType: 'CORS Preflight Blocked',
          details: { origin }
        });
        res.status(403).json({ error: 'Origin not allowed', errorCode: 'CORS_ORIGIN_BLOCKED' });
        return;
      }

      // Set CORS headers for preflight
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Methods', config.methods.join(','));
      res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(','));

      if (config.exposedHeaders.length > 0) {
        res.header('Access-Control-Expose-Headers', config.exposedHeaders.join(','));
      }

      if (config.credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      res.header('Access-Control-Max-Age', config.maxAge.toString());

      // Add security headers
      addSecurityHeaders(res, config);

      res.sendStatus(204);
      return;
    }

    // Handle actual requests
    if (origin) {
      // Validate origin
      if (!validateOrigin(origin, config)) {
        config.logger('Request blocked for origin', { origin, method, path: req.path });
        logSecurityEvent({
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          method: req.method,
          route: req.originalUrl || req.path,
          attackType: 'CORS Blocked',
          details: { origin }
        });
        res.status(403).json({ error: 'Origin not allowed', errorCode: 'CORS_ORIGIN_BLOCKED' });
        return;
      }

      // Set CORS headers
      res.header('Access-Control-Allow-Origin', origin);
      if (config.credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }
    }

    // Add security headers for all requests
    addSecurityHeaders(res, config);

    next();
  };
}

/**
 * Default CORS protection middleware with .env config
 */
export const corsProtectionMiddleware = createCORSProtectionMiddleware();

