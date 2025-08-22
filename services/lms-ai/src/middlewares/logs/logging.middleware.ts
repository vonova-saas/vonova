import { Request, Response, NextFunction } from 'express';
import { roadmapLoggerInstance } from '../../utils/roadmap-logger';
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
  roadmapLoggerInstance.logRequest(req, `${req.method} ${req.url}`);

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
  roadmapLoggerInstance.logResponse(
    `${req.method} ${req.url}`,
    res.statusCode,
    duration,
    req.userId
  );

  // Log performance if it exceeds threshold
  if (LoggingConfig.enablePerformanceLogging && duration > LoggingConfig.performanceThreshold) {
    roadmapLoggerInstance.logPerformance(
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
      roadmapLoggerInstance.logUserAction(
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
export const errorLoggingMiddleware = (error: any, req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
  if (!LoggingConfig.enableErrorLogging) {
    return next(error);
  }

  const duration = req.startTime ? Date.now() - req.startTime : 0;
  
  // Log the error with context
  roadmapLoggerInstance.logError(
    error,
    'HTTP Request',
    `${req.method} ${req.url}`,
    req.userId,
    req.roadmapId
  );

  // Log security events for certain error types
  if (error.statusCode === 401 || error.statusCode === 403) {
    roadmapLoggerInstance.logSecurityEvent(
      `Unauthorized access attempt: ${error.message}`,
      req.ip || 'unknown',
      req.userId,
      {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        errorCode: error.statusCode
      }
    );
  }

  next(error);
};

/**
 * Helper function to determine the action from the request
 */
function getActionFromRequest(req: LoggedRequest): string | null {
  const { method, url } = req;
  
  if (method === 'POST' && url.includes('/generate')) {
    return 'roadmap_generated';
  } else if (method === 'GET' && url.includes('/roadmap/')) {
    return 'roadmap_viewed';
  } else if (method === 'PUT' && url.includes('/progress')) {
    return 'progress_updated';
  } else if (method === 'GET' && url.includes('/analytics')) {
    return 'analytics_viewed';
  } else if (method === 'GET' && url.includes('/popular-topics')) {
    return 'popular_topics_viewed';
  } else if (method === 'GET' && url.includes('/stats')) {
    return 'stats_viewed';
  } else if (method === 'GET' && url.includes('/search')) {
    return 'roadmap_searched';
  }
  
  return null;
}

/**
 * Middleware to log database operations
 */
export const databaseLoggingMiddleware = (operation: string, collection: string, startTime: number, success: boolean, error?: any) => {
  if (!LoggingConfig.enableDatabaseLogging) {
    return;
  }

  const duration = Date.now() - startTime;
  
  roadmapLoggerInstance.logDatabaseOperation(
    operation,
    collection,
    duration,
    success,
    error
  );

  // Log slow queries
  if (LoggingConfig.logQueryTime && duration > LoggingConfig.performanceThreshold) {
    roadmapLoggerInstance.logWarning(
      `Slow database operation: ${operation} on ${collection}`,
      'database',
      operation,
      {
        duration,
        threshold: LoggingConfig.performanceThreshold,
        collection
      }
    );
  }
};

/**
 * Middleware to log AI service operations
 */
export const aiServiceLoggingMiddleware = (operation: string, startTime: number, success: boolean, error?: any, requestData?: any, responseData?: any) => {
  if (!LoggingConfig.enableAIServiceLogging) {
    return;
  }

  const duration = Date.now() - startTime;
  
  // Log the AI service call
  roadmapLoggerInstance.logAIServiceCall(
    operation,
    duration,
    success,
    error
  );

  // Log request data if enabled
  if (LoggingConfig.logAIRequests && requestData) {
    roadmapLoggerInstance.logDebug(
      `AI service request: ${operation}`,
      'ai-service',
      operation,
      {
        requestData: sanitizeRequestData(requestData),
        duration
      }
    );
  }

  // Log response data if enabled
  if (LoggingConfig.logAIResponses && responseData && success) {
    roadmapLoggerInstance.logDebug(
      `AI service response: ${operation}`,
      'ai-service',
      operation,
      {
        responseData: sanitizeResponseData(responseData),
        duration
      }
    );
  }

  // Log performance if it exceeds threshold
  if (LoggingConfig.enablePerformanceLogging && duration > LoggingConfig.performanceThreshold) {
    roadmapLoggerInstance.logPerformance(
      `AI service ${operation}`,
      duration,
      {
        operation,
        success,
        hasError: !!error
      }
    );
  }
};

/**
 * Sanitize request data to remove sensitive information
 */
function sanitizeRequestData(data: any): any {
  if (!LoggingConfig.logSensitiveData) {
    const sanitized = { ...data };
    // Remove potentially sensitive fields
    delete sanitized.apiKey;
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }
  return data;
}

/**
 * Sanitize response data to remove sensitive information
 */
function sanitizeResponseData(data: any): any {
  if (!LoggingConfig.logSensitiveData) {
    const sanitized = { ...data };
    // Remove potentially sensitive fields
    delete sanitized.apiKey;
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }
  return data;
}

// Export all middleware functions
export const loggingMiddleware = {
  request: requestLoggingMiddleware,
  response: responseLoggingMiddleware,
  error: errorLoggingMiddleware,
  database: databaseLoggingMiddleware,
  aiService: aiServiceLoggingMiddleware
};
