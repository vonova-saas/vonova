import { Request, Response, NextFunction, RequestHandler } from 'express';
import { sanitize } from 'express-mongo-sanitize';

/**
 * Configuration options for the NoSQL sanitization middleware
 */
export interface SanitizationConfig {
  /** Character to replace dangerous patterns with */
  replaceWith?: string;
  /** Whether to remove dangerous keys entirely instead of replacing */
  remove?: boolean;
  /** Custom logger function for external monitoring */
  externalLogger?: (logData: SanitizationLogData) => Promise<void> | void;
  /** Whether to log sanitization events */
  enableLogging?: boolean;
}

/**
 * Structure for sanitization log data
 */
export interface SanitizationLogData {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  route: string;
  sanitizedKey: string;
  originalValue: any;
  sanitizedValue: any;
  location: 'body' | 'query' | 'params';
}

/**
 * Default configuration for the sanitization middleware
 */
const DEFAULT_CONFIG: Required<SanitizationConfig> = {
  replaceWith: '_',
  remove: false,
  externalLogger: () => {},
  enableLogging: true,
};

/**
 * Patterns that are considered dangerous in NoSQL contexts
 */
const DANGEROUS_PATTERNS = [
  /^\$/,           // MongoDB operators like $where, $ne, etc.
  /\./,            // Dot notation that could access nested properties
  /javascript:/i,   // JavaScript protocol
  /function\s*\(/i, // Function declarations
  /eval\s*\(/i,    // eval() calls
];

/**
 * Recursively sanitizes an object by removing or replacing dangerous keys
 * @param obj - The object to sanitize
 * @param config - Sanitization configuration
 * @param location - Where the object comes from (body, query, params)
 * @param req - Express request object for logging context
 * @returns Object containing sanitized data and sanitization events
 */
function sanitizeObject(
  obj: any,
  config: Required<SanitizationConfig>,
  location: 'body' | 'query' | 'params',
  req: Request
): { sanitized: any; events: SanitizationLogData[] } {
  const events: SanitizationLogData[] = [];
  
  if (obj === null || typeof obj !== 'object') {
    return { sanitized: obj, events };
  }

  if (Array.isArray(obj)) {
    const sanitizedArray = obj.map(item => 
      sanitizeObject(item, config, location, req)
    );
    
    const allEvents = sanitizedArray.flatMap(result => result.events);
    const sanitizedValues = sanitizedArray.map(result => result.sanitized);
    
    return { sanitized: sanitizedValues, events: allEvents };
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    let sanitizedKey = key;
    let shouldSanitize = false;

    // Check if key matches dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(key)) {
        shouldSanitize = true;
        break;
      }
    }

    if (shouldSanitize) {
      const logData: SanitizationLogData = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        method: req.method,
        route: req.route?.path || req.path,
        sanitizedKey: key,
        originalValue: value,
        sanitizedValue: config.remove ? undefined : value,
        location,
      };

      events.push(logData);

      if (config.remove) {
        continue; // Skip adding this key to sanitized object
      } else {
        sanitizedKey = key.replace(/[\$\.]/g, config.replaceWith);
      }
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      const nestedResult = sanitizeObject(value, config, location, req);
      sanitized[sanitizedKey] = nestedResult.sanitized;
      events.push(...nestedResult.events);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return { sanitized, events };
}

/**
 * Logs sanitization events to console and external logger
 * @param events - Array of sanitization events
 * @param config - Sanitization configuration
 */
async function logSanitizationEvents(
  events: SanitizationLogData[],
  config: Required<SanitizationConfig>
): Promise<void> {
  if (!config.enableLogging || events.length === 0) {
    return;
  }

  for (const event of events) {
    // Console logging with security context
    console.warn('🛡️  NoSQL Injection Sanitization Event:', {
      timestamp: event.timestamp,
      ip: event.ip,
      userAgent: event.userAgent,
      method: event.method,
      route: event.route,
      sanitizedKey: event.sanitizedKey,
      location: event.location,
      severity: 'MEDIUM',
    });

    // External logger (e.g., Sentry, custom monitoring)
    try {
      await config.externalLogger(event);
    } catch (error) {
      console.error('Failed to log sanitization event to external service:', error);
    }
  }
}

/**
 * Creates a NoSQL sanitization middleware with configurable options
 * @param userConfig - User-provided configuration options
 * @returns Express middleware function
 */
export function createNoSQLSanitizationMiddleware(
  userConfig: SanitizationConfig = {}
): RequestHandler {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allEvents: SanitizationLogData[] = [];

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        const bodyResult = sanitizeObject(req.body, config, 'body', req);
        req.body = bodyResult.sanitized;
        allEvents.push(...bodyResult.events);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        const step1 = sanitizeObject(req.query, config, 'query', req);
        const finalSanitized = sanitize(step1);
        Object.assign(req.query, finalSanitized);
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        const paramsResult = sanitizeObject(req.params, config, 'params', req);
        req.params = paramsResult.sanitized;
        allEvents.push(...paramsResult.events);
      }

      // Log all sanitization events
      await logSanitizationEvents(allEvents, config);

      next();
    } catch (error) {
      console.error('Error in NoSQL sanitization middleware:', error);
      next(error);
    }
  };
}

/**
 * Pre-configured sanitization middleware with default settings
 * Suitable for most production use cases
 */
export const noSQLSanitizationMiddleware = createNoSQLSanitizationMiddleware();