import { Request, Response, NextFunction } from 'express';
import { LoggingConfig } from '../../config/logging.config';

export interface LoggedRequest extends Request {
  startTime?: number;
  userId?: string;
  roadmapId?: string | undefined;
}

export interface LoggedResponse extends Response {
  responseBody?: any;
}

/**
 * Simple console logger for the main application
 */
const consoleLogger = {
  logRequest: (req: LoggedRequest, message: string) => {
    if (LoggingConfig.enableUserTracking) {
      console.log(`[REQUEST] ${message} - User: ${req.userId || 'anonymous'} - IP: ${req.ip}`);
    }
  },
  
  logResponse: (message: string, statusCode: number, duration: number, userId?: string) => {
    if (LoggingConfig.enableUserTracking) {
      console.log(`[RESPONSE] ${message} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId || 'anonymous'}`);
    }
  },
  
  logPerformance: (message: string, duration: number, metadata: any) => {
    if (LoggingConfig.enablePerformanceLogging) {
      console.log(`[PERFORMANCE] ${message} - Duration: ${duration}ms`, metadata);
    }
  },
  
  logUserAction: (action: string, userId: string, roadmapId: string, metadata: any) => {
    if (LoggingConfig.logUserActions) {
      console.log(`[USER_ACTION] ${action} - User: ${userId} - Roadmap: ${roadmapId}`, metadata);
    }
  },
  
  logError: (error: Error, context: string, metadata?: any) => {
    if (LoggingConfig.enableErrorLogging) {
      console.error(`[ERROR] ${context} - ${error.message}`, metadata);
      if (LoggingConfig.logErrorStack) {
        console.error(error.stack);
      }
    }
  }
};

/**
 * Middleware to log incoming requests
 */
export const requestLoggingMiddleware = (req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
  if (!LoggingConfig.enableUserTracking) {
    return next();
  }

  // Record start time for performance tracking
  req.startTime = Date.now();
  
  // Extract user ID from request (if available)
  req.userId = (req as any).user?.id || req.headers['x-user-id'] as string;
  
  // Extract roadmap ID from URL params
  const roadmapIdMatch = req.url.match(/\/roadmap\/([^\/]+)/);
  req.roadmapId = roadmapIdMatch ? roadmapIdMatch[1] : undefined;

  // Log the incoming request
  consoleLogger.logRequest(req, `${req.method} ${req.url}`);

  // Override res.json to capture response body for logging
  const originalJson = res.json;
  res.json = function(data: any) {
    res.responseBody = data;
    return originalJson.call(this, data);
  };

  // Override res.send to capture response body for logging
  const originalSend = res.send;
  res.send = function(data: any) {
    res.responseBody = data;
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log outgoing responses
 */
export const responseLoggingMiddleware = (req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
  if (!LoggingConfig.enableUserTracking) {
    return next();
  }

  // Calculate response time
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  
  // Log the response
  consoleLogger.logResponse(
    `${req.method} ${req.url}`,
    res.statusCode,
    duration,
    req.userId
  );

  // Log performance if it exceeds threshold
  if (LoggingConfig.enablePerformanceLogging && duration > LoggingConfig.performanceThreshold) {
    consoleLogger.logPerformance(
      `${req.method} ${req.url}`,
      duration,
      {
        statusCode: res.statusCode,
        userId: req.userId,
        roadmapId: req.roadmapId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
  }

  // Log user action if it's a roadmap-related operation
  if (LoggingConfig.logUserActions && req.roadmapId) {
    const action = getActionFromRequest(req);
    if (action) {
      consoleLogger.logUserAction(
        action,
        req.userId || 'anonymous',
        req.roadmapId,
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          responseSize: JSON.stringify(res.responseBody).length
        }
      );
    }
  }

  next();
};

/**
 * Middleware to log errors
 */
export const errorLoggingMiddleware = (error: Error, req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
  if (LoggingConfig.enableErrorLogging) {
    consoleLogger.logError(error, `${req.method} ${req.url}`, {
      userId: req.userId,
      roadmapId: req.roadmapId,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: LoggingConfig.logSensitiveData ? req.body : '[REDACTED]',
      query: req.query
    });
  }
  next(error);
};

/**
 * Helper function to determine the action from the request
 */
function getActionFromRequest(req: LoggedRequest): string | null {
  const { method, url } = req;
  
  if (url.includes('/roadmap')) {
    if (method === 'POST' && url.includes('/generate')) return 'roadmap_generated';
    if (method === 'GET' && url.includes('/roadmap/')) return 'roadmap_viewed';
    if (method === 'PUT' && url.includes('/progress')) return 'roadmap_progress_updated';
    if (method === 'DELETE' && url.includes('/roadmap/')) return 'roadmap_deleted';
  }
  
  if (url.includes('/pdf-summary')) {
    if (method === 'POST' && url.includes('/generate')) return 'pdf_summary_generated';
    if (method === 'POST' && url.includes('/upload')) return 'pdf_uploaded';
    if (method === 'POST' && url.includes('/chat')) return 'pdf_chat_interaction';
    if (method === 'GET' && url.includes('/summary/')) return 'pdf_summary_viewed';
  }
  
  return null;
}

/**
 * Export the console logger for use in other parts of the application
 */
export { consoleLogger as roadmapLoggerInstance };
