/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error('RPC Exception caught', {
      exception,
      details: exception?.details || exception,
      code: exception?.code,
      statusCode: exception?.statusCode,
      message: exception?.message,
    });

    // Handle different error structures from microservice
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';

    if (exception?.statusCode) {
      statusCode = exception.statusCode;
      message = exception.message || 'Internal server error';
      error = exception.error || 'Error';
    } else if (exception?.details) {
      statusCode =
        exception.details.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.details.message || 'Internal server error';
      error = exception.details.error || 'Error';
    } else if (exception?.message) {
      message = exception.message;
      error = exception.error || 'Error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
