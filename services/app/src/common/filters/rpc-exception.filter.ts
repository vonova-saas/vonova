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

    // Throw the actual error structure that the gateway expects
    return throwError(() => ({
      statusCode: exception?.status || 500,
      message:
        typeof error === 'string'
          ? error
          : error?.message || 'Internal server error',
      error: exception?.name || 'Error',
    }));
  }
}
