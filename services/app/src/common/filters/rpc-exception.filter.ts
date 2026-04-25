/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<any> {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /** Gateway RpcExceptionFilter expects `message` to be a string. */
  private normalizeOutgoingMessage(message: unknown): string {
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      const first = message[0];
      return typeof first === 'string' ? first : JSON.stringify(message);
    }
    return 'Internal server error';
  }

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const error = exception?.response || exception?.message || exception;

    this.logger.error('Microservice exception caught', {
      exception,
      statusCode: exception?.status,
      message:
        typeof error === 'string'
          ? error
          : error?.message || 'Internal server error',
      errorName: exception?.name || 'Error',
    });

    const message = this.normalizeOutgoingMessage(
      typeof error === 'string' ? error : error?.message,
    );

    // Throw the actual error structure that the gateway expects
    return throwError(() => ({
      statusCode: exception?.status || 500,
      message,
      error: exception?.name || 'Error',
    }));
  }
}
