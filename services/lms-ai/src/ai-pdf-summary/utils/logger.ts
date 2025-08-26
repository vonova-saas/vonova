import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Env } from '../../config/env.config';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs', 'ai-pdf-summary');

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

// Create logger instance for PDF Summary service
export const pdfSummaryLogger = winston.createLogger({
  level: Env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'ai-pdf-summary' },
  transports: [
    // Single log file for all logs with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'pdf-summary-%DATE%.log'),
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
  pdfSummaryLogger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Logging functions for different operations
export const logPDFUpload = (userId: string, filename: string, fileSize: number, success: boolean, error?: any) => {
  pdfSummaryLogger.info('PDF upload processed', {
    userId,
    filename,
    fileSize,
    success,
    error: error?.message || null,
    timestamp: new Date().toISOString()
  });
};

export const logSummaryGeneration = (summaryId: string, filename: string, summaryType: string, success: boolean, error?: any, processingTime?: number) => {
  pdfSummaryLogger.info('PDF summary generation', {
    summaryId,
    filename,
    summaryType,
    success,
    error: error?.message || null,
    processingTime,
    timestamp: new Date().toISOString()
  });
};

export const logPDFChat = (sessionId: string, userId: string, question: string, success: boolean, error?: any, responseTime?: number) => {
  pdfSummaryLogger.info('PDF chat interaction', {
    sessionId,
    userId,
    question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
    success,
    error: error?.message || null,
    responseTime,
    timestamp: new Date().toISOString()
  });
};

export const logAIServiceCall = (endpoint: string, requestData: any, responseData?: any, error?: any, duration?: number) => {
  pdfSummaryLogger.info('AI service call', {
    endpoint,
    requestData: sanitizeRequestData(requestData),
    responseData: sanitizeResponseData(responseData),
    error: error?.message || null,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logDatabaseOperation = (operation: string, collection: string, query?: any, result?: any, error?: any, duration?: number) => {
  pdfSummaryLogger.info('Database operation', {
    operation,
    collection,
    query: sanitizeQueryData(query),
    result: sanitizeResultData(result),
    error: error?.message || null,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  pdfSummaryLogger.info('Performance metric', {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const logUserActivity = (userId: string, action: string, summaryId?: string, metadata?: any) => {
  pdfSummaryLogger.info('User activity', {
    userId,
    action,
    summaryId,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const logSecurityEvent = (ip: string, userAgent: string, action: string, details?: any) => {
  pdfSummaryLogger.warn('Security event', {
    ip,
    userAgent,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error: Error, context: string, metadata?: any) => {
  pdfSummaryLogger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    context,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// Utility functions for sanitizing sensitive data
function sanitizeRequestData(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeResponseData(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeQueryData(query: any): any {
  if (!query) return query;
  
  const sanitized = { ...query };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeResultData(result: any): any {
  if (!result) return result;
  
  // For large results, just log the count or first few items
  if (Array.isArray(result)) {
    if (result.length > 10) {
      return { count: result.length, preview: result.slice(0, 3) };
    }
    return result;
  }
  
  if (typeof result === 'object') {
    const keys = Object.keys(result);
    if (keys.length > 20) {
      return { keys: keys.slice(0, 10), hasMore: true };
    }
    return result;
  }
  
  return result;
}

// Export default logger instance
export default pdfSummaryLogger;
