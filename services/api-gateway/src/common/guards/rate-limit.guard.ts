import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  /** Max requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Optional bucket name; defaults to `${method}:${route}`. */
  bucket?: string;
}

/**
 * Marks a route as rate limited. Combine with `RateLimitGuard` in `@UseGuards`.
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

interface BucketEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-process token bucket rate limiter.
 *
 * Good enough for single-instance development and protecting hot endpoints
 * from runaway scripts. Production deployments should replace the in-memory
 * `Map` with a Redis-backed store; the public guard contract stays identical.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  // Static so the limiter survives across the request lifecycle within a node.
  private static readonly buckets = new Map<string, BucketEntry>();
  private static lastSweep = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req?.user?._id ?? req?.user?.sub ?? null;
    const ip =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.connection?.remoteAddress ||
      'anon';
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const bucket = options.bucket ?? handler;
    const key = `${bucket}:${userId ?? ip}`;

    const now = Date.now();
    this.maybeSweep(now);

    let entry = RateLimitGuard.buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      RateLimitGuard.buckets.set(key, entry);
    }
    entry.count++;

    if (entry.count > options.limit) {
      const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private maybeSweep(now: number) {
    // Drop expired keys at most every 30s so the map doesn't grow forever.
    if (now - RateLimitGuard.lastSweep < 30_000) return;
    RateLimitGuard.lastSweep = now;
    for (const [k, v] of RateLimitGuard.buckets.entries()) {
      if (v.resetAt <= now) RateLimitGuard.buckets.delete(k);
    }
  }
}
