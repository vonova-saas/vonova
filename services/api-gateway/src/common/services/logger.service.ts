/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  public readonly logsDir = path.join(process.cwd(), 'logs');

  constructor() {
    // Ensure logs directory exists
    this.ensureLogsDirectory();

    // Configure log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      }),
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      }),
    ];

    // File transports for production
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_FILE_LOGGING === 'true'
    ) {
      // Combined log (all logs)
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.logsDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
          level: 'info',
        }),
      );

      // Error log (errors only)
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
          level: 'error',
        }),
      );

      // Request/Response log
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.logsDir, 'requests-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
          level: 'info',
        }),
      );
    }

    // Create logger instance
    const logLevel = process.env.LOG_LEVEL;
    if (!logLevel) {
      throw new Error('LOG_LEVEL is required in .env');
    }
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'exceptions.log'),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'rejections.log'),
        }),
      ],
    });
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      // Use console.log here since logger isn't initialized yet
      console.log(`Logs directory created: ${this.logsDir}`);
    }
  }

  log(message: string, context?: any): void {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: any): void {
    this.logger.error(message, { trace, ...context });
  }

  warn(message: string, context?: any): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: any): void {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: any): void {
    this.logger.verbose(message, context);
  }

  // Custom method for request logging
  logRequest(req: any, res: any, responseTime?: number): void {
    const logData: Record<string, any> = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      timestamp: new Date().toISOString(),
    };

    // Include user info if available
    if (req.user) {
      logData['userId'] = req.user.id;
      logData['userRole'] = req.user.role;
    }

    // Include request body for POST/PUT/PATCH (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitizedBody = this.sanitizeBody(req.body);
      logData['requestBody'] = sanitizedBody;
    }

    this.logger.info('HTTP Request', logData);
  }

  // Custom method for response logging
  logResponse(
    req: any,
    res: any,
    responseData?: any,
    responseTime?: number,
  ): void {
    const logData: Record<string, any> = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      timestamp: new Date().toISOString(),
    };

    // Include response data if provided (be careful with large responses)
    if (responseData && typeof responseData === 'object') {
      const sanitizedResponse = this.sanitizeResponse(responseData);
      logData['responseData'] = sanitizedResponse;
    }

    this.logger.info('HTTP Response', logData);
  }

  // Sanitize request body to remove sensitive information
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  // Sanitize response data
  private sanitizeResponse(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Limit response size to prevent huge logs
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 10000) {
      return { ...data, _truncated: true, _size: jsonString.length };
    }

    return this.sanitizeBody(data);
  }

  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
