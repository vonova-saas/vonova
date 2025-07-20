import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logSecurityEvent } from '../../services/securityLogger.service';

/**
 * Configuration options for the NoSQL detection middleware
 */
export interface DetectionConfig {
  /** Custom logger function for external monitoring */
  externalLogger?: (logData: DetectionLogData) => Promise<void> | void;
  /** Whether to log detection events */
  enableLogging?: boolean;
  /** Custom response message for detected threats */
  errorMessage?: string;
  /** Custom error code for detected threats */
  errorCode?: string;
  /** HTTP status code to return on threat detection */
  statusCode?: number;
}

/**
 * Structure for detection log data
 */
export interface DetectionLogData {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  route: string;
  threatType: string;
  affectedPath: string;
  rawValue: any;
  location: 'body' | 'query' | 'params';
  severity: 'HIGH' | 'CRITICAL';
  riskScore: number;
}

/**
 * Default configuration for the detection middleware
 */
const DEFAULT_CONFIG: Required<DetectionConfig> = {
  externalLogger: () => {},
  enableLogging: true,
  errorMessage: 'Invalid request data detected',
  errorCode: 'INVALID_REQUEST_DATA',
  statusCode: 400,
};

/**
 * Comprehensive patterns for detecting NoSQL injection attempts
 */
const THREAT_PATTERNS = {
  // MongoDB operators (HIGH risk)
  mongoOperators: {
    pattern: /^\$(?:where|regex|expr|jsonSchema|text|geoNear|near|nearSphere|geoWithin|geoIntersects|all|elemMatch|size|exists|type|mod|nin|in|ne|gt|gte|lt|lte|or|and|not|nor)$/i,
    severity: 'HIGH' as const,
    riskScore: 8,
    description: 'MongoDB operator detected',
  },
  
  // JavaScript injection (CRITICAL risk)
  javascriptInjection: {
    pattern: /(?:javascript:|eval\s*\(|function\s*\(|setTimeout\s*\(|setInterval\s*\(|Function\s*\(|constructor|prototype)/i,
    severity: 'CRITICAL' as const,
    riskScore: 10,
    description: 'JavaScript injection attempt',
  },

  // MongoDB $where with JavaScript (CRITICAL risk)
  whereClause: {
    pattern: /\$where.*(?:function|this\.|obj\.|sleep|while|for)/i,
    severity: 'CRITICAL' as const,
    riskScore: 10,
    description: 'MongoDB $where clause with JavaScript',
  },

  // NoSQL operator patterns in values (HIGH risk)
  operatorInValue: {
    pattern: /(?:\{\s*\$(?:gt|gte|lt|lte|ne|in|nin|exists|regex|where|expr)\s*:|sleep\s*\(|benchmark\s*\()/i,
    severity: 'HIGH' as const,
    riskScore: 9,
    description: 'NoSQL operator in value',
  },

  // Regex injection patterns (HIGH risk)
  regexInjection: {
    pattern: /(?:\{\s*\$regex\s*:|\..*\*|\.\+|\.\{|\[\^|\$\$|\^\^)/i,
    severity: 'HIGH' as const,
    riskScore: 7,
    description: 'Regex injection pattern',
  },

  // Command injection attempts (CRITICAL risk)
  commandInjection: {
    pattern: /(?:;\s*(?:cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|rm|mv|cp|chmod|chown)|&&|\|\||`.*`|\$\(.*\))/i,
    severity: 'CRITICAL' as const,
    riskScore: 10,
    description: 'Command injection attempt',
  },

  // Prototype pollution (HIGH risk)
  prototypePollution: {
    pattern: /(?:__proto__|constructor\.prototype|prototype\.constructor)/i,
    severity: 'HIGH' as const,
    riskScore: 8,
    description: 'Prototype pollution attempt',
  },
};

/**
 * Recursively scans an object for dangerous patterns
 * @param obj - The object to scan
 * @param config - Detection configuration
 * @param location - Where the object comes from (body, query, params)
 * @param req - Express request object for logging context
 * @param currentPath - Current path in the object tree
 * @returns Array of detection events
 */
function scanObjectForThreats(
  obj: any,
  config: Required<DetectionConfig>,
  location: 'body' | 'query' | 'params',
  req: Request,
  currentPath: string = ''
): DetectionLogData[] {
  const threats: DetectionLogData[] = [];

  if (obj === null || obj === undefined) {
    return threats;
  }

  // Convert to string for pattern matching
  const objString = typeof obj === 'string' ? obj : JSON.stringify(obj);

  // Check each threat pattern
  for (const [threatName, threatConfig] of Object.entries(THREAT_PATTERNS)) {
    if (threatConfig.pattern.test(objString)) {
      const logData: DetectionLogData = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        method: req.method,
        route: req.route?.path || req.path,
        threatType: `${threatName}: ${threatConfig.description}`,
        affectedPath: currentPath || location,
        rawValue: obj,
        location,
        severity: threatConfig.severity,
        riskScore: threatConfig.riskScore,
      };

      threats.push(logData);
    }
  }

  // Recursively scan nested objects and arrays
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const nestedPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        threats.push(...scanObjectForThreats(item, config, location, req, nestedPath));
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        // Check key itself for threats
        for (const [threatName, threatConfig] of Object.entries(THREAT_PATTERNS)) {
          if (threatConfig.pattern.test(key)) {
            const logData: DetectionLogData = {
              timestamp: new Date().toISOString(),
              ip: req.ip || req.connection.remoteAddress || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown',
              method: req.method,
              route: req.route?.path || req.path,
              threatType: `${threatName} in key: ${threatConfig.description}`,
              affectedPath: currentPath ? `${currentPath}.${key}` : key,
              rawValue: key,
              location,
              severity: threatConfig.severity,
              riskScore: threatConfig.riskScore,
            };

            threats.push(logData);
          }
        }

        // Recursively scan value
        const nestedPath = currentPath ? `${currentPath}.${key}` : key;
        threats.push(...scanObjectForThreats(value, config, location, req, nestedPath));
      }
    }
  }

  return threats;
}

/**
 * Logs detection events to console and external logger
 * @param threats - Array of detection events
 * @param config - Detection configuration
 */
async function logDetectionEvents(
  threats: DetectionLogData[],
  config: Required<DetectionConfig>
): Promise<void> {
  if (!config.enableLogging || threats.length === 0) {
    return;
  }

  for (const threat of threats) {
    // Console logging with security context
    const logLevel = threat.severity === 'CRITICAL' ? 'error' : 'warn';
    console[logLevel]('🚨 NoSQL Injection Threat Detected:', {
      timestamp: threat.timestamp,
      ip: threat.ip,
      userAgent: threat.userAgent,
      method: threat.method,
      route: threat.route,
      threatType: threat.threatType,
      affectedPath: threat.affectedPath,
      location: threat.location,
      severity: threat.severity,
      riskScore: threat.riskScore,
    });

    // External logger (e.g., Sentry, custom monitoring)
    try {
      await config.externalLogger(threat);
    } catch (error) {
      console.error('Failed to log detection event to external service:', error);
    }
  }
}

/**
 * Creates a NoSQL detection middleware with configurable options
 * @param userConfig - User-provided configuration options
 * @returns Express middleware function
 */
export function createNoSQLDetectionMiddleware(
  userConfig: DetectionConfig = {}
): RequestHandler {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allThreats: DetectionLogData[] = [];

      // Scan request body
      if (req.body) {
        const bodyThreats = scanObjectForThreats(req.body, config, 'body', req);
        allThreats.push(...bodyThreats);
      }

      // Scan query parameters
      if (req.query) {
        const queryThreats = scanObjectForThreats(req.query, config, 'query', req);
        allThreats.push(...queryThreats);
      }

      // Scan route parameters
      if (req.params) {
        const paramsThreats = scanObjectForThreats(req.params, config, 'params', req);
        allThreats.push(...paramsThreats);
      }

      // If threats are detected, log and block the request
      if (allThreats.length > 0) {
        await logDetectionEvents(allThreats, config);
        // Log and save the NoSQL injection attack
        await logSecurityEvent({
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          method: req.method,
          route: req.originalUrl || req.path,
          attackType: 'NoSQL Injection',
          details: allThreats
        });

        // Calculate overall risk score
        const maxRiskScore = Math.max(...allThreats.map(t => t.riskScore));
        const threatCount = allThreats.length;

        res.status(config.statusCode).json({
          error: config.errorMessage,
          errorCode: config.errorCode,
          timestamp: new Date().toISOString(),
          // Additional context for monitoring (remove in production if sensitive)
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              threatCount,
              maxRiskScore,
              ip: req.ip || 'unknown',
            },
          }),
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error in NoSQL detection middleware:', error);
      next(error);
    }
  };
}

/**
 * Pre-configured detection middleware with default settings
 * Suitable for most production use cases
 */
export const noSQLDetectionMiddleware = createNoSQLDetectionMiddleware();