import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import type { Request } from 'express';

type ResolvedRpcPayload = {
  statusCode: number;
  message: string;
  error: string;
};

/**
 * Maps NATS / ClientProxy failures to HTTP responses.
 *
 * `instanceof RpcException` is unreliable when the gateway bundles a different
 * copy of `@nestjs/microservices` than the app microservice — the thrown value
 * is still shaped like RpcException (`error` payload + optional `getError()`).
 */
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

    if (exception instanceof HttpException) {
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

        if (r.details && Array.isArray(r.details)) {
          const validationError = r.details[0];
          if (validationError?.constraints) {
            const constraints = validationError.constraints;
            const constraintMessages = Object.values(constraints);
            if (constraintMessages.length > 0) {
              const firstMessage = constraintMessages[0];
              message =
                typeof firstMessage === 'string' ? firstMessage : message;
            }
          }
        }
      } else {
        message = typeof res === 'string' ? res : message;
      }
    } else {
      const micro = this.tryResolveMicroserviceHttpPayload(exception);
      if (micro && this.isValidHttpStatus(micro.statusCode)) {
        statusCode = micro.statusCode;
        message = micro.message;
        error = micro.error;
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
          const m = ex.message;
          if (typeof m === 'string') {
            message = m;
          } else if (typeof m === 'object') {
            message = JSON.stringify(m);
          } else {
            message = `${m as number | boolean | bigint}`;
          }
          error = typeof ex.error === 'string' ? ex.error : error;
        }
      }
    }

    const requestId =
      (request as { id?: string }).id ||
      request.header?.('x-request-id') ||
      undefined;

    const isFavicon404 =
      statusCode === HttpStatus.NOT_FOUND &&
      request.url?.endsWith('/favicon.ico');
    if (!isFavicon404) {
      // 4xx → warn, 5xx → error. Stack traces stay server-side only.
      const stack =
        exception instanceof Error ? exception.stack : undefined;
      const meta = {
        statusCode,
        message,
        path: request.url,
        method: request.method,
        requestId,
        ...(stack ? { stack } : {}),
      };
      if (statusCode >= 500) {
        this.logger.error('Exception caught', meta);
      } else {
        this.logger.warn('Exception caught', meta);
      }
    }

    // Sanitize anything that smells like a database / driver error before it
    // reaches the client. Validation messages and intentional HttpExceptions
    // are passed through unchanged.
    const isProduction =
      (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
    if (
      isProduction &&
      statusCode >= 500 &&
      /mongo|nats|jwt|aws|s3|ECONN|ENOTFOUND|TimeoutError/i.test(message)
    ) {
      message = 'Internal server error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    });
  }

  private isValidHttpStatus(code: number): boolean {
    return Number.isFinite(code) && code >= 400 && code <= 599;
  }

  private tryResolveMicroserviceHttpPayload(
    exception: unknown,
  ): ResolvedRpcPayload | null {
    if (!exception || typeof exception !== 'object') {
      return null;
    }
    const ex = exception as Record<string, unknown>;

    // RpcException stores the constructor argument on `.error` (flat or wrapped).
    const errProp = ex.error;
    if (errProp && typeof errProp === 'object' && !Array.isArray(errProp)) {
      const fromErr = this.pickPayloadFromRpcBody(errProp);
      if (fromErr) return fromErr;
    }

    if (typeof ex.getError === 'function') {
      const fromGet = this.pickPayloadFromRpcBody(
        (ex as { getError: () => unknown }).getError(),
      );
      if (fromGet) return fromGet;
    }

    const responseProp = ex.response;
    if (responseProp && typeof responseProp === 'object') {
      const fromResp = this.pickPayloadFromRpcBody(responseProp);
      if (fromResp) return fromResp;
    }

    return this.pickPayloadFromRpcBody(exception);
  }

  private pickPayloadFromRpcBody(body: unknown): ResolvedRpcPayload | null {
    if (body == null || typeof body !== 'object') {
      return null;
    }
    const o = body as Record<string, unknown>;
    const inner = o.error;
    if (
      inner &&
      typeof inner === 'object' &&
      !Array.isArray(inner) &&
      this.hasStatusCode(inner)
    ) {
      return this.recordToPayload(inner as Record<string, unknown>);
    }
    if (this.hasStatusCode(o)) {
      return this.recordToPayload(o);
    }
    return null;
  }

  private hasStatusCode(obj: object): boolean {
    return (
      'statusCode' in obj &&
      (obj as { statusCode?: unknown }).statusCode != null
    );
  }

  private recordToPayload(o: Record<string, unknown>): ResolvedRpcPayload {
    return {
      statusCode: Number(o.statusCode),
      message:
        typeof o.message === 'string' ? o.message : 'Internal server error',
      error: typeof o.error === 'string' ? o.error : 'Error',
    };
  }
}
