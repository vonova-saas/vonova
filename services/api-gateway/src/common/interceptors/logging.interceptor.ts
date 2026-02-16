import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, ip } = request;
    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest(request, response);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          // Log successful response
          this.logger.logResponse(request, response, data, responseTime);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          // Log error response
          this.logger.error('Request failed', error.stack, {
            method,
            url,
            statusCode: response.statusCode || 500,
            responseTime: `${responseTime}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}

