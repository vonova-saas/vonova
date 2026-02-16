import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../utils/appError';
import { createLogger } from '../../utils/logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = createLogger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;

    if (exception instanceof AppError) {
      status = exception.statusCode as number;
      message = exception.message;
      errorCode = exception.errorCode;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = String(exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errorCode && { errorCode }),
    };

    // Log the error
    const errorDetails = {
      path: request.url,
      method: request.method,
      statusCode: status,
      ...(errorCode && { errorCode }),
      ...(request.ip && { ip: request.ip }),
      ...(request.user && { userId: (request.user as any).userId }),
    };

    if (status >= 500) {
      const errorMessage = `[${request.method}] ${request.url} - ${status} - ${message}`;
      this.logger.error(
        errorMessage,
        exception instanceof Error ? exception.stack : undefined,
        'HttpExceptionFilter',
        errorDetails,
      );
    } else if (status >= 400) {
      const warnMessage = `[${request.method}] ${request.url} - ${status} - ${message}`;
      this.logger.warn(warnMessage, errorDetails);
    }

    response.status(status).json(errorResponse);
  }
}
