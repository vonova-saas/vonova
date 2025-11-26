import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import * as winston from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    // Log incoming request
    this.logger.log(`Incoming Request: ${method} ${url}`, {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': headers['content-type'],
        'authorization': headers['authorization'] ? 'Bearer ***' : undefined,
      }
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.log(`Outgoing Response: ${method} ${url} - ${statusCode}`, {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            ip,
            userAgent,
            timestamp: new Date().toISOString(),
            dataSize: JSON.stringify(data).length
          });

          // Winston structured logging
          this.winstonLogger.info('Request completed', {
            method,
            url,
            statusCode,
            responseTime,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const { statusCode } = response;

          // Log error response
          this.logger.error(`Request Error: ${method} ${url} - ${statusCode}`, {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            ip,
            userAgent,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });

          // Winston error logging
          this.winstonLogger.error('Request failed', {
            method,
            url,
            statusCode,
            responseTime,
            ip,
            userAgent,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      })
    );
  }
}
