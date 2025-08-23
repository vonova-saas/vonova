import { createLogger, format, transports, Logger } from 'winston';
import { Request } from 'express';
import { Env } from '../config/env.config';

// Custom log levels for roadmap operations
const roadmapLevels = {
  error: 0,
  warn: 1,
  info: 2,
  roadmap: 3,    // Custom level for roadmap-specific operations
  debug: 4,
  verbose: 5
};

// Custom colors for roadmap logs
const roadmapColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  roadmap: 'cyan',    // Special color for roadmap operations
  debug: 'blue',
  verbose: 'magenta'
};

// Custom format for roadmap logs
const roadmapFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, service, operation, userId, roadmapId, duration, error, ...meta }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] [ROADMAP]`;
    
    if (service) logMessage += ` [${service}]`;
    if (operation) logMessage += ` [${operation}]`;
    if (userId) logMessage += ` [User:${userId}]`;
    if (roadmapId) logMessage += ` [Roadmap:${roadmapId}]`;
    if (duration) logMessage += ` [${duration}ms]`;
    
    logMessage += ` ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    if (error) {
      logMessage += `\nError: ${(error as any).stack || (error as any).message || error}`;
    }
    
    return logMessage;
  })
);

// Create the main roadmap logger
export const roadmapLogger = createLogger({
  levels: roadmapLevels,
  level: Env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: roadmapFormat,
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        roadmapFormat
      )
    }),
    
    // File transport for roadmap operations
    new transports.File({
      filename: 'logs/roadmap-operations.log',
      level: 'roadmap',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: format.combine(
        format.uncolorize(),
        roadmapFormat
      )
    }),
    
    // File transport for errors
    new transports.File({
      filename: 'logs/roadmap-errors.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: format.combine(
        format.uncolorize(),
        roadmapFormat
      )
    }),
    
    // File transport for all logs
    new transports.File({
      filename: 'logs/roadmap-all.log',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      format: format.combine(
        format.uncolorize(),
        roadmapFormat
      )
    })
  ]
});

// Add colors to the logger
import 'winston-daily-rotate-file';

// Helper functions for different types of logging
export class RoadmapLogger {
  private logger: Logger;

  constructor() {
    this.logger = roadmapLogger;
  }

  // Log roadmap generation operations
  logRoadmapGeneration(request: any, response: any, duration: number, userId?: string) {
    this.logger.log('roadmap', 'Roadmap generated successfully', {
      service: 'roadmap-generator',
      operation: 'generate',
      userId,
      roadmapId: response?.roadmapId,
      duration,
      topic: request?.topic,
      skillLevel: request?.skill_level,
      durationWeeks: request?.duration_weeks,
      aiModelUsed: response?.ai_model_used,
      generationTime: response?.generation_time_ms
    });
  }

  // Log roadmap retrieval operations
  logRoadmapRetrieval(roadmapId: string, duration: number, userId?: string) {
    this.logger.log('roadmap', 'Roadmap retrieved', {
      service: 'roadmap-generator',
      operation: 'retrieve',
      userId,
      roadmapId,
      duration
    });
  }

  // Log progress updates
  logProgressUpdate(roadmapId: string, userId: string, weekNumber?: number, milestoneWeek?: number, progressPercentage?: number) {
    this.logger.log('roadmap', 'Progress updated', {
      service: 'roadmap-generator',
      operation: 'progress-update',
      userId,
      roadmapId,
      weekNumber,
      milestoneWeek,
      progressPercentage
    });
  }

  // Log AI service communication
  logAIServiceCall(operation: string, duration: number, success: boolean, error?: any) {
    const level = success ? 'info' : 'error';
    this.logger.log(level, `AI service ${operation}`, {
      service: 'ai-communication',
      operation,
      duration,
      success,
      error: error?.message || error
    });
  }

  // Log database operations
  logDatabaseOperation(operation: string, collection: string, duration: number, success: boolean, error?: any) {
    const level = success ? 'info' : 'error';
    this.logger.log(level, `Database ${operation}`, {
      service: 'database',
      operation,
      collection,
      duration,
      success,
      error: error?.message || error
    });
  }

  // Log user actions
  logUserAction(action: string, userId: string, roadmapId?: string, details?: any) {
    this.logger.log('roadmap', `User action: ${action}`, {
      service: 'user-tracking',
      operation: action,
      userId,
      roadmapId,
      details
    });
  }

  // Log system events
  logSystemEvent(event: string, details?: any) {
    this.logger.log('info', `System event: ${event}`, {
      service: 'system',
      operation: event,
      details
    });
  }

  // Log performance metrics
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.log('info', `Performance: ${operation}`, {
      service: 'performance',
      operation,
      duration,
      metadata
    });
  }

  // Log security events
  logSecurityEvent(event: string, ip: string, userId?: string, details?: any) {
    this.logger.log('warn', `Security event: ${event}`, {
      service: 'security',
      operation: event,
      ip,
      userId,
      details
    });
  }

  // Log request details
  logRequest(req: Request, operation: string) {
    this.logger.log('info', `Request received: ${operation}`, {
      service: 'http',
      operation,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id
    });
  }

  // Log response details
  logResponse(operation: string, statusCode: number, duration: number, userId?: string) {
    this.logger.log('info', `Response sent: ${operation}`, {
      service: 'http',
      operation,
      statusCode,
      duration,
      userId
    });
  }

  // Log errors with context
  logError(error: any, context: string, operation: string, userId?: string, roadmapId?: string) {
    this.logger.error(`Error in ${context}: ${operation}`, {
      service: 'error-handling',
      operation,
      context,
      userId,
      roadmapId,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      }
    });
  }

  // Log warnings
  logWarning(message: string, context: string, operation: string, details?: any) {
    this.logger.warn(`Warning in ${context}: ${message}`, {
      service: 'warning',
      operation,
      context,
      details
    });
  }

  // Log debug information
  logDebug(message: string, context: string, operation: string, details?: any) {
    this.logger.debug(`Debug in ${context}: ${message}`, {
      service: 'debug',
      operation,
      context,
      details
    });
  }
}

// Create and export a singleton instance
export const roadmapLoggerInstance = new RoadmapLogger();

// Export the base logger for direct use
export { roadmapLogger as logger };

// Export types for TypeScript
export interface LogContext {
  service: string;
  operation: string;
  userId?: string;
  roadmapId?: string;
  duration?: number;
  [key: string]: any;
}

export interface RoadmapLogData {
  topic?: string;
  skillLevel?: string;
  durationWeeks?: number;
  aiModelUsed?: string;
  generationTime?: number;
  weekNumber?: number;
  milestoneWeek?: number;
  progressPercentage?: number;
  [key: string]: any;
}
