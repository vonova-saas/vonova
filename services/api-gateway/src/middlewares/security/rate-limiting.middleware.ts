import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logSecurityEvent } from '../../services/security/securityLogger.service';

// Optional Redis import - will be undefined if redis is not installed
let createClient: any;
try {
  createClient = require('redis').createClient;
} catch {
  createClient = null;
}

/**
 * Configuration options for rate limiting middleware
 */
export interface RateLimitConfig {
  /** Time window in seconds for rate limiting */
  windowMs?: number;
  /** Maximum number of requests per window */
  maxRequests?: number;
  /** Redis client for distributed rate limiting */
  redisClient?: ReturnType<typeof createClient>;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Custom response handler */
  handler?: (req: Request, res: Response) => void;
  /** Whether to include rate limit headers in response */
  standardHeaders?: boolean;
  /** Whether to include legacy rate limit headers */
  legacyHeaders?: boolean;
  /** Skip rate limiting for specific routes */
  skipRoutes?: string[];
  /** Different limits for different user types */
  limits?: {
    default: number;
    authenticated?: number;
    admin?: number;
  };
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  redisClient: null as any,
  keyGenerator: (req: Request) => {
    // Use IP address as default key
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(DEFAULT_CONFIG.windowMs / 1000),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipRoutes: [],
  limits: {
    default: 100,
    authenticated: 200,
    admin: 500,
  },
};

/**
 * In-memory store for rate limiting (fallback when Redis is not available)
 */
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;

    // Check if window has expired
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }

    return data;
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs,
    });
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const data = await this.get(key);
    
    if (!data) {
      await this.set(key, 1, windowMs);
      return { count: 1, resetTime: Date.now() + windowMs };
    }

    const newCount = data.count + 1;
    await this.set(key, newCount, windowMs);
    return { count: newCount, resetTime: data.resetTime };
  }
}

/**
 * Creates rate limiting middleware with configurable options
 * @param userConfig - User-provided configuration
 * @returns Express middleware function
 */
export function createRateLimitMiddleware(
  userConfig: RateLimitConfig = {}
): RequestHandler {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const store = config.redisClient || new MemoryStore();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip rate limiting for specified routes
      if (config.skipRoutes.some(pattern => {
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(req.path);
      })) {
        next();
        return;
      }

      // Generate rate limit key
      const key = config.keyGenerator(req);
      const rateLimitKey = `rate_limit:${key}`;

      // Determine limit based on user type
      let limit = config.limits.default;
      const user = (req as any).user;
      if (user && user.role === 'admin') {
        limit = config.limits.admin || config.limits.default;
      } else if (user) {
        limit = config.limits.authenticated || config.limits.default;
      }

      // Get current rate limit data
      const data = await store.increment(rateLimitKey, config.windowMs);
      
      // Calculate remaining requests and reset time
      const remaining = Math.max(0, limit - data.count);
      const resetTime = new Date(data.resetTime);
      const retryAfter = Math.ceil((data.resetTime - Date.now()) / 1000);

      // Set rate limit headers
      if (config.standardHeaders) {
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', remaining.toString());
        res.set('X-RateLimit-Reset', resetTime.getTime().toString());
      }

      if (config.legacyHeaders) {
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', remaining.toString());
        res.set('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000).toString());
      }

      // Check if rate limit exceeded
      if (data.count > limit) {
        res.set('Retry-After', retryAfter.toString());
        logSecurityEvent({
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          method: req.method,
          route: req.originalUrl || req.path,
          attackType: 'Rate Limit',
          details: { count: data.count, limit }
        });
        config.handler(req, res);
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting on error
      next();
    }
  };
}

/**
 * Pre-configured rate limiting middleware with default settings
 */
export const rateLimitMiddleware = createRateLimitMiddleware();
