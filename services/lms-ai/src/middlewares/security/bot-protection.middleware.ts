import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logSecurityEvent } from '../../services/securityLogger.service';

/**
 * Configuration options for bot protection middleware
 */
export interface BotProtectionConfig {
  /** List of known bad user agents (regex patterns) */
  badUserAgents?: RegExp[];
  /** Custom response for blocked bots */
  blockMessage?: string;
  /** Skip protection for specific routes */
  skipRoutes?: string[];
}

const DEFAULT_CONFIG: Required<BotProtectionConfig> = {
  badUserAgents: [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /libwww-perl/i,
    /scrapy/i,
    /httpclient/i,
    /phantomjs/i,
    /selenium/i,
    /headless/i,
    /bot/i,
    /spider/i,
    /crawler/i,
  ],
  blockMessage: 'Access denied: suspected bot activity',
  skipRoutes: [],
};

/**
 * Creates bot protection middleware
 */
export function createBotProtectionMiddleware(
  userConfig: BotProtectionConfig = {}
): RequestHandler {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip protection for specified routes
    if (config.skipRoutes.some(pattern => {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(req.path);
    })) {
      next();
      return;
    }

    const userAgent = req.get('User-Agent') || '';
    if (config.badUserAgents.some(pattern => pattern.test(userAgent))) {
      logSecurityEvent({
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent,
        method: req.method,
        route: req.originalUrl || req.path,
        attackType: 'Bot',
        details: { userAgent }
      });
      res.status(403).json({ error: config.blockMessage, errorCode: 'BOT_BLOCKED' });
      return;
    }

    next();
  };
}

/**
 * Pre-configured bot protection middleware
 */
export const botProtectionMiddleware = createBotProtectionMiddleware();
