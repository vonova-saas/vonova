import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../utils/app-error.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || message;
    } else if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    this.logger.error(`Error occurred on PATH: ${request.path}`, {
      error: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.path,
      method: request.method,
      body: request.body,
      query: request.query,
      params: request.params,
      headers: {
        'user-agent': request.get('User-Agent'),
        'content-type': request.get('Content-Type')
      },
      timestamp: new Date().toISOString()
    });

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorCode && { errorCode })
    };

    response.status(status).json(errorResponse);
  }
}
