import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Env } from '../../config/env.config';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs', 'ai-roadmap-generator');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create the logger instance
export const roadmapLogger = winston.createLogger({
  level: Env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'ai-roadmap-generator' },
  transports: [
    // Single log file for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'roadmap-ai-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ]
});

// Add console transport for development
if (Env.NODE_ENV !== 'production') {
  roadmapLogger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Specialized logging functions
export const logRequest = (method: string, url: string, body?: any, headers?: any) => {
  roadmapLogger.info(`[REQUEST] ${method} ${url}`, {
    type: 'request',
    method,
    url,
    body: body ? JSON.stringify(body) : undefined,
    headers,
    timestamp: new Date().toISOString()
  });
};

export const logResponse = (method: string, url: string, statusCode: number, responseTime: number, body?: any) => {
  roadmapLogger.info(`[RESPONSE] ${method} ${url} - ${statusCode} (${responseTime}ms)`, {
    type: 'response',
    method,
    url,
    statusCode,
    responseTime,
    body: body ? JSON.stringify(body) : undefined,
    timestamp: new Date().toISOString()
  });
};

export const logAIServiceCall = (endpoint: string, requestData: any, responseData?: any, error?: any, duration?: number) => {
  const status = error ? 'ERROR' : 'SUCCESS';
  roadmapLogger.info(`[AI_SERVICE] ${status} - ${endpoint} (${duration}ms)`, {
    type: 'ai_service',
    endpoint,
    request: requestData,
    response: responseData,
    error: error?.message,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logDatabaseOperation = (operation: string, collection: string, query?: any, result?: any, error?: any, duration?: number) => {
  const status = error ? 'ERROR' : 'SUCCESS';
  roadmapLogger.info(`[DATABASE] ${status} - ${operation} on ${collection} (${duration}ms)`, {
    type: 'database',
    operation,
    collection,
    query,
    result: result ? { count: result.length || 1 } : undefined,
    error: error?.message,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  roadmapLogger.info(`[PERFORMANCE] ${operation} - ${duration}ms`, {
    type: 'performance',
    operation,
    duration,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

export const logRoadmapGeneration = (roadmapId: string, topic: string, skillLevel: string, duration: number, success: boolean, error?: any) => {
  const status = success ? 'SUCCESS' : 'FAILED';
  roadmapLogger.info(`[ROADMAP] ${status} - ${topic} (${skillLevel}) - ${duration}ms`, {
    type: 'roadmap_generation',
    roadmapId,
    topic,
    skillLevel,
    duration,
    success,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

export const logUserActivity = (userId: string, action: string, roadmapId?: string, metadata?: any) => {
  roadmapLogger.info(`[USER] ${action} - ${userId}`, {
    type: 'user_activity',
    userId,
    action,
    roadmapId,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

export default roadmapLogger;
