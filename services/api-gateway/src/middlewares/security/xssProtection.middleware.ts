import { Request, Response, NextFunction, RequestHandler } from 'express';
import { FilterXSS } from 'xss';
import { logSecurityEvent } from '../../services/security/securityLogger.service';

/**
 * Configuration interface for XSS protection middleware
 */
interface XSSProtectionConfig {
  /** Custom XSS filter options */
  xssOptions?: any;
  /** Custom logger function for sanitization events */
  logger?: (logData: SanitizationLogData) => void;
  /** Optional monitoring service hook (e.g., Sentry) */
  monitoringHook?: (logData: SanitizationLogData) => void;
  /** Skip sanitization for specific routes (array of route patterns) */
  skipRoutes?: string[];
  /** Maximum depth for recursive sanitization (prevents infinite loops) */
  maxDepth?: number;
  /** Whether to log original values (disable in production for security) */
  logOriginalValues?: boolean;
}

/**
 * Structure for sanitization log data
 */
interface SanitizationLogData {
  timestamp: string;
  ip: string;
  method: string;
  route: string;
  userAgent: string;
  sanitizedPaths: Array<{
    path: string;
    originalValue?: string;
    sanitizedValue?: string;
    valueType: 'body' | 'query' | 'params';
  }>;
  totalSanitizations: number;
}

/**
 * Default XSS filter configuration
 * Configured for HR system with stricter rules
 */
const DEFAULT_XSS_OPTIONS = {
  whiteList: {
    // Allow basic formatting tags that might be needed in HR forms
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    // Remove script, iframe, object, embed, and other dangerous tags
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  css: false, // Disable CSS to prevent CSS-based XSS
};

/**
 * Default logger function
 */
const defaultLogger = (logData: SanitizationLogData): void => {
  console.warn('[XSS Protection] Sanitization performed:', {
    timestamp: logData.timestamp,
    ip: logData.ip,
    method: logData.method,
    route: logData.route,
    totalSanitizations: logData.totalSanitizations,
    affectedPaths: logData.sanitizedPaths.map(p => p.path),
  });
};

/**
 * XSS Protection Middleware Class
 * Provides comprehensive protection against Cross-Site Scripting attacks
 */
class XSSProtectionMiddleware {
  private readonly xssFilter: FilterXSS;
  private readonly config: Required<XSSProtectionConfig>;

  constructor(config: XSSProtectionConfig = {}) {
    this.config = {
      xssOptions: config.xssOptions || DEFAULT_XSS_OPTIONS,
      logger: config.logger || defaultLogger,
      monitoringHook: config.monitoringHook || (() => {}),
      skipRoutes: config.skipRoutes || [],
      maxDepth: config.maxDepth || 10,
      logOriginalValues: config.logOriginalValues ?? false,
    };

    this.xssFilter = new FilterXSS(this.config.xssOptions);
  }

  /**
   * Main middleware function
   */
  public middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Skip sanitization for specified routes
        if (this.shouldSkipRoute(req.path)) {
          next();
          return;
        }

        const sanitizationLog: SanitizationLogData = {
          timestamp: new Date().toISOString(),
          ip: this.getClientIP(req),
          method: req.method,
          route: req.path,
          userAgent: req.get('User-Agent') || 'Unknown',
          sanitizedPaths: [],
          totalSanitizations: 0,
        };

        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          this.sanitizeObject(req.body, 'body', [], sanitizationLog);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          this.sanitizeObject(req.query, 'query', [], sanitizationLog);
        }

        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
          this.sanitizeObject(req.params, 'params', [], sanitizationLog);
        }

        // Log and monitor if sanitization occurred
        if (sanitizationLog.totalSanitizations > 0) {
          this.config.logger(sanitizationLog);
          this.config.monitoringHook(sanitizationLog);
          // Log and save the XSS attack
          logSecurityEvent({
            ip: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            method: req.method,
            route: req.originalUrl || req.path,
            attackType: 'XSS',
            details: sanitizationLog.sanitizedPaths
          });
          res.status(400).json({
            error: 'XSS attempt detected',
            errorCode: 'XSS_DETECTED',
            sanitizedPaths: sanitizationLog.sanitizedPaths.map(p => p.path),
            timestamp: sanitizationLog.timestamp
          });
          return;
        }

        next();
      } catch (error) {
        console.error('[XSS Protection] Error in middleware:', error);
        // Don't block the request, but log the error
        next();
      }
    };
  }

  /**
   * Recursively sanitize an object or array
   */
  private sanitizeObject(
    obj: any,
    valueType: 'body' | 'query' | 'params',
    currentPath: string[],
    logData: SanitizationLogData,
    depth: number = 0
  ): void {
    // Prevent infinite recursion
    if (depth > this.config.maxDepth) {
      console.warn('[XSS Protection] Maximum recursion depth reached');
      return;
    }

    if (obj === null || obj === undefined) {
      return;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = [...currentPath, index.toString()];
        if (typeof item === 'string') {
          const sanitized = this.sanitizeString(item);
          if (sanitized !== item) {
            obj[index] = sanitized;
            this.logSanitization(newPath, item, sanitized, valueType, logData);
          }
        } else if (typeof item === 'object' && item !== null) {
          this.sanitizeObject(item, valueType, newPath, logData, depth + 1);
        }
      });
      return;
    }

    // Handle objects
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const newPath = [...currentPath, key];
        const value = obj[key];

        if (typeof value === 'string') {
          const sanitized = this.sanitizeString(value);
          if (sanitized !== value) {
            obj[key] = sanitized;
            this.logSanitization(newPath, value, sanitized, valueType, logData);
          }
        } else if (typeof value === 'object' && value !== null) {
          this.sanitizeObject(value, valueType, newPath, logData, depth + 1);
        }
      });
    }
  }

  /**
   * Sanitize a string value using the XSS filter
   */
  private sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }

    return this.xssFilter.process(value);
  }

  /**
   * Log a sanitization event
   */
  private logSanitization(
    path: string[],
    originalValue: string,
    sanitizedValue: string,
    valueType: 'body' | 'query' | 'params',
    logData: SanitizationLogData
  ): void {
    const pathString = path.length > 0 ? path.join('.') : 'root';
    
    logData.sanitizedPaths.push({
      path: `${valueType}.${pathString}`,
      originalValue: this.config.logOriginalValues ? originalValue : undefined,
      sanitizedValue: this.config.logOriginalValues ? sanitizedValue : undefined,
      valueType,
    });
    
    logData.totalSanitizations++;
  }

  /**
   * Check if the current route should skip sanitization
   */
  private shouldSkipRoute(path: string): boolean {
    return this.config.skipRoutes.some(pattern => {
      // Support simple glob patterns with *
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    });
  }

  /**
   * Extract client IP address from request
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      'Unknown'
    );
  }
}

/**
 * Factory function to create XSS protection middleware
 * @param config - Configuration options for the middleware
 * @returns Express middleware function
 */
const createXSSProtection = (config?: XSSProtectionConfig): RequestHandler => {
  const middleware = new XSSProtectionMiddleware(config);
  return middleware.middleware();
};

/**
 * Default XSS protection middleware with standard configuration
 */
const xssProtection = createXSSProtection();

export default xssProtection;
export { createXSSProtection, XSSProtectionConfig, SanitizationLogData };