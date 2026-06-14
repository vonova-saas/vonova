import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

interface GatewayErrorPayload {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<unknown> {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(
    exception: unknown,
    _host: ArgumentsHost,
  ): Observable<GatewayErrorPayload> {
    const ex = exception as Record<string, unknown> | undefined;
    const statusCode = (ex?.status as number) ?? 500;
    const errorName = (ex?.name as string) ?? 'Error';
    const rawError = ex?.response ?? ex?.message ?? exception;
    const message =
      typeof rawError === 'string'
        ? rawError
        : ((rawError as { message?: string })?.message ??
          'Internal server error');

    // 4xx is a client/data condition (e.g. orphaned references, validation
    // failures) — log at warn so dashboards stay clean and only 5xx pages the
    // on-call. Server-side bugs (status >= 500 or anything we can't classify)
    // still surface as error with the full payload.
    const payload = { statusCode, message, errorName };
    if (statusCode >= 400 && statusCode < 500) {
      this.logger.warn('Microservice exception caught', payload);
    } else {
      this.logger.error('Microservice exception caught', payload);
    }

    return throwError(
      (): GatewayErrorPayload => ({
        statusCode,
        message,
        error: errorName,
      }),
    );
  }
}
