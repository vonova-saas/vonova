import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import configuration from '../config/configuration';

@Injectable()
export class BotProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BotProtectionMiddleware.name);
  private readonly badUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i,
    /go-http/i,
    /okhttp/i,
    /postman/i,
    /insomnia/i,
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;

    // Allow Postman and Insomnia in development mode
    if (
      configuration().NODE_ENV === 'development' &&
      (userAgent.includes('Postman') || userAgent.includes('Insomnia'))
    ) {
      next();
      return;
    }

    // Check if user agent is suspicious
    if (this.isBadUserAgent(userAgent)) {
      this.logger.warn(`Bot detected: ${userAgent}`, {
        ip,
        userAgent,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied - Bot protection active',
        error: 'Bot detected',
      });
    }

    // Check for missing user agent
    if (!userAgent || userAgent.trim() === '') {
      this.logger.warn(`Missing user agent from IP: ${ip}`, {
        ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied - User agent required',
        error: 'Missing user agent',
      });
    }

    next();
  }

  private isBadUserAgent(userAgent: string): boolean {
    return this.badUserAgents.some((pattern) => pattern.test(userAgent));
  }
}
