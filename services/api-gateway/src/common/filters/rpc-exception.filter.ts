import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import type { Request } from 'express';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';

    if (exception instanceof RpcException) {
      const err = exception.getError() as Record<string, unknown> | string;
      if (typeof err === 'object' && err !== null && err.statusCode != null) {
        statusCode = Number(err.statusCode);
        message =
          typeof err.message === 'string' ? err.message : message;
        error = (typeof err.error === 'string' ? err.error : error) as string;
      } else {
        message = typeof err === 'string' ? err : message;
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const r = res as {
          message?: string | string[];
          error?: string;
          details?: Array<{
            property?: string;
            constraints?: Record<string, string>;
          }>;
        };
        message = Array.isArray(r.message)
          ? (r.message[0] ?? message)
          : (r.message ?? message);
        error = r.error ?? 'Error';

        // If we have validation details, format the message properly
        if (r.details && Array.isArray(r.details)) {
          const validationError = r.details[0];
          if (validationError?.constraints) {
            const constraints = validationError.constraints;
            const constraintMessages = Object.values(constraints);
            if (constraintMessages.length > 0) {
              const firstMessage = constraintMessages[0];
              message = typeof firstMessage === 'string' ? firstMessage : message;
            }
          }
        }
      } else {
        message = typeof res === 'string' ? res : message;
      }
    } else {
      const ex = exception as Record<string, unknown>;
      if (ex?.statusCode != null) {
        statusCode = ex.statusCode as number;
        message =
          typeof ex.message === 'string'
            ? ex.message
            : ((ex.message as string) ?? message);
        error = (ex.error as string) ?? error;
      } else if (ex?.details && typeof ex.details === 'object') {
        const d = ex.details as Record<string, unknown>;
        statusCode =
          (d.statusCode as number) ?? HttpStatus.INTERNAL_SERVER_ERROR;
        message = (d.message as string) ?? message;
        error = (d.error as string) ?? error;
      } else if (ex?.message !== undefined && ex?.message !== null) {
        message =
          typeof ex.message === 'string'
            ? ex.message
            : typeof ex.message === 'object'
              ? JSON.stringify(ex.message)
              : String(ex.message);
        error = (ex.error as string) ?? error;
      }
    }

    const isFavicon404 =
      statusCode === HttpStatus.NOT_FOUND &&
      request.url?.endsWith('/favicon.ico');
    if (!isFavicon404) {
      this.logger.error('Exception caught', {
        statusCode,
        message,
        path: request.url,
      });
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
