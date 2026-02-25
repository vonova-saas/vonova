import { Catch, RpcExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

interface GatewayErrorPayload {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<unknown> {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, _host: ArgumentsHost): Observable<GatewayErrorPayload> {
    const ex = exception as Record<string, unknown> | undefined;
    const statusCode = (ex?.status as number) ?? 500;
    const errorName = (ex?.name as string) ?? 'Error';
    const rawError = ex?.response ?? ex?.message ?? exception;
    const message =
      typeof rawError === 'string'
        ? rawError
        : (rawError as { message?: string })?.message ?? 'Internal server error';

    this.logger.error('Microservice exception caught', {
      statusCode,
      message,
      errorName,
    });

    return throwError(
      (): GatewayErrorPayload => ({
        statusCode,
        message,
        error: errorName,
      }),
    );
  }
}
