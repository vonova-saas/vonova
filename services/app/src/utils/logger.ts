import { LoggerService, Logger } from '@nestjs/common';
import { Env } from '../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export class AppLogger implements LoggerService {
  private readonly logger: Logger;
  private readonly context: string;
  private readonly isDevelopment: boolean;
  private readonly logsDir: string;
  private readonly serviceName: string = 'auth';

  constructor(context: string = 'Application') {
    this.logger = new Logger(context);
    this.context = context;
    this.isDevelopment = Env.NODE_ENV !== 'production';
    this.logsDir = path.join(process.cwd(), 'logs', this.serviceName);
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Get current date string for log file naming (YYYY-MM-DD)
   */
  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get log file path for today
   */
  private getLogFilePath(): string {
    const dateString = this.getDateString();
    return path.join(this.logsDir, `${this.serviceName}-${dateString}.log`);
  }

  /**
   * Write log to file
   */
  private writeToFile(
    level: string,
    message: string,
    ...optionalParams: any[]
  ): void {
    try {
      // Ensure directory exists before writing (in case it was deleted)
      this.ensureLogsDirectory();

      const timestamp = new Date().toISOString();
      const context = `[${this.context}]`;
      const levelTag = `[${level.toUpperCase()}]`;
      const formattedParams = this.formatParams(optionalParams).join(' ');
      const logEntry = `${timestamp} ${levelTag} ${context} ${message}${formattedParams ? ' ' + formattedParams : ''}\n`;

      fs.appendFileSync(this.getLogFilePath(), logEntry, 'utf8');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]): void {
    this.logger.log(message, ...this.formatParams(optionalParams));
    this.writeToFile('log', String(message), ...optionalParams);
  }

  /**
   * Write an 'error' level log.
   */
  error(
    message: any,
    trace?: string,
    context?: string,
    ...optionalParams: any[]
  ): void {
    this.logger.error(
      message,
      trace,
      context || this.context,
      ...this.formatParams(optionalParams),
    );
    const errorMessage = trace ? `${message}\n${trace}` : String(message);
    this.writeToFile('error', errorMessage, ...optionalParams);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.logger.warn(message, ...this.formatParams(optionalParams));
    this.writeToFile('warn', String(message), ...optionalParams);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      this.logger.debug(message, ...this.formatParams(optionalParams));
      this.writeToFile('debug', String(message), ...optionalParams);
    }
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      this.logger.verbose(message, ...this.formatParams(optionalParams));
      this.writeToFile('verbose', String(message), ...optionalParams);
    }
  }

  /**
   * Log an HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime?: number,
    userId?: string,
  ): void {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` - ${responseTime}ms` : ''}${userId ? ` - User: ${userId}` : ''}`;
    if (statusCode >= 500) {
      this.error(message);
    } else if (statusCode >= 400) {
      this.warn(message);
    } else {
      this.log(message);
    }
  }

  /**
   * Log authentication events
   */
  logAuth(event: string, details?: Record<string, any>): void {
    const message = `[AUTH] ${event}`;
    const params = details ? [details] : [];
    this.log(message, ...params);
  }

  /**
   * Log security events
   */
  logSecurity(event: string, details?: Record<string, any>): void {
    const message = `[SECURITY] ${event}`;
    this.warn(message, details);
  }

  /**
   * Log database operations
   */
  logDatabase(operation: string, details?: Record<string, any>): void {
    const message = `[DB] ${operation}`;
    this.debug(message, details);
  }

  /**
   * Format optional parameters for better logging
   */
  private formatParams(params: any[]): any[] {
    return params.map((param) => {
      if (typeof param === 'object' && param !== null) {
        try {
          return JSON.stringify(param, null, this.isDevelopment ? 2 : 0);
        } catch {
          return param;
        }
      }
      return param;
    });
  }

  /**
   * Set the context for this logger instance
   */
  setContext(context: string): void {
    (this.logger as any).context = context;
  }
}

/**
 * Create a logger instance with a specific context
 */
export function createLogger(context: string): AppLogger {
  return new AppLogger(context);
}

/**
 * Default application logger
 */
export const appLogger = new AppLogger('VonovaAuth');
