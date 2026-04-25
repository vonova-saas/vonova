/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { EMPTY } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly appRoutePrefixes = new Set([
    'auth',
    'onboarding',
    'settings',
    'account',
    'billing',
    'support',
    'feedback',
    'waitlist',
    'community',
  ]);

  constructor(
    private readonly logger: LoggerService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest(request, response);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          // Log successful response
          this.logger.logResponse(request, response, data, responseTime);
          this.publishMonitoringLog(request, response.statusCode, responseTime);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          // Log error response
          this.logger.error('Request failed', error.stack, {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            error: error.message,
          });
          this.publishMonitoringLog(
            request,
            statusCode,
            responseTime,
            error instanceof Error ? error.stack : undefined,
            error?.message,
          );
        },
      }),
    );
  }

  private publishMonitoringLog(
    request: any,
    statusCode: number,
    responseTimeMs: number,
    stackTrace?: string,
    errorMessage?: string,
  ): void {
    const source = this.detectSource(request);
    let level: 'error' | 'warning' | 'info' = 'info';
    if (statusCode >= 500) level = 'error';
    else if (statusCode >= 400) level = 'warning';
    const message = `${request.method} ${request.originalUrl || request.url} ${statusCode}`;

    const userId =
      typeof request?.user?._id === 'string' && request.user._id.length === 24
        ? request.user._id
        : '000000000000000000000000';

    // Always send performance data for metrics, even if admin logs are disabled
    this.natsClient
      .send(
        { cmd: 'admin.performance.log' },
        {
          userId,
          action: 'HTTP Request',
          metadata: {
            source,
            level,
            message,
            method: request.method,
            path: request.path,
            url: request.originalUrl || request.url,
            statusCode,
            responseTimeMs,
            ip: request.ip,
            stackTrace,
            error: errorMessage,
          },
        },
      )
      .pipe(
        take(1),
        catchError(() => EMPTY),
      )
      .subscribe();

    // Only send admin event logs if not disabled
    if (process.env.HIDE_ADMIN_LOGS !== 'true') {
      this.natsClient
        .send(
          { cmd: 'admin.event.log' },
          {
            userId,
            action: message,
            metadata: {
              source,
              level,
              message,
              method: request.method,
              path: request.path,
              url: request.originalUrl || request.url,
              statusCode,
              responseTimeMs,
              ip: request.ip,
              stackTrace,
              error: errorMessage,
            },
          },
        )
        .pipe(
          take(1),
          catchError(() => EMPTY),
        )
        .subscribe();
    }
  }

  private detectSource(request: any): 'api-gateway' | 'app' | 'lms' {
    const url = String(
      request?.originalUrl || request?.url || request?.path || '',
    );
    const path = url.split('?')[0].replace(/^\/+/, '');
    const segments = path.split('/');
    const apiIndex = segments.findIndex((segment) => segment === 'api');
    const routeSegment = apiIndex >= 0 ? segments[apiIndex + 2] : segments[0];

    if (routeSegment === 'lms') return 'lms';
    if (routeSegment === 'app' || this.appRoutePrefixes.has(routeSegment))
      return 'app';
    return 'api-gateway';
  }
}
