import { Request, Response, NextFunction } from 'express';
import { logRequest, logResponse, logAIServiceCall, logDatabaseOperation } from '../utils/logger';

// Request logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log incoming request
  logRequest(req.method, req.originalUrl, req.body, {
    'user-agent': req.get('User-Agent'),
    'x-forwarded-for': req.get('X-Forwarded-For'),
    'content-type': req.get('Content-Type')
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    logResponse(req.method, req.originalUrl, res.statusCode, responseTime, body);
    return originalJson.call(this, body);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type')
    },
    timestamp: new Date().toISOString()
  };

  // Log error with full context
  require('../utils/logger').roadmapLogger.error('Request error', errorInfo);

  next(error);
};

// AI Service call logging wrapper
export const logAIServiceCallWrapper = async (
  endpoint: string,
  requestData: any,
  serviceCall: () => Promise<any>
): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const response = await serviceCall();
    const duration = Date.now() - startTime;
    
    logAIServiceCall(endpoint, requestData, response, null, duration);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logAIServiceCall(endpoint, requestData, null, error, duration);
    throw error;
  }
};

// Database operation logging wrapper
export const logDatabaseOperationWrapper = async (
  operation: string,
  collection: string,
  query: any,
  dbOperation: () => Promise<any>
): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const result = await dbOperation();
    const duration = Date.now() - startTime;
    
    logDatabaseOperation(operation, collection, query, result, null, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabaseOperation(operation, collection, query, null, error, duration);
    throw error;
  }
};
