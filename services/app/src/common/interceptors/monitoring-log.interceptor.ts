import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, EMPTY } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';

@Injectable()
export class MonitoringLogInterceptor implements NestInterceptor {
  constructor(
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const payload = this.getPayload(context);
    const pattern = this.getPattern(context);

    // Prevent recursive loop: this interceptor also wraps admin.event.log handler.
    if (pattern === 'admin.event.log') {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          this.publish({
            payload,
            pattern,
            level: 'info',
            statusCode: 200,
            responseTimeMs: Date.now() - start,
          });
        },
        error: (error: unknown) => {
          const ex = error as { message?: string; stack?: string; status?: number };
          this.publish({
            payload,
            pattern,
            level: 'error',
            statusCode: ex?.status ?? 500,
            responseTimeMs: Date.now() - start,
            errorMessage: ex?.message ?? 'Microservice handler failed',
            stackTrace: ex?.stack,
          });
        },
      }),
    );
  }

  private publish(params: {
    payload: Record<string, unknown>;
    pattern: string;
    level: 'info' | 'error';
    statusCode: number;
    responseTimeMs: number;
    errorMessage?: string;
    stackTrace?: string;
  }) {
    const userId = this.extractUserId(params.payload);
    const message = `NATS ${params.pattern} ${params.statusCode}`;

    this.natsClient
      .send(
        { cmd: 'admin.event.log' },
        {
          userId,
          action: message,
          metadata: {
            source: 'app',
            level: params.level,
            message,
            pattern: params.pattern,
            statusCode: params.statusCode,
            responseTimeMs: params.responseTimeMs,
            error: params.errorMessage,
            stackTrace: params.stackTrace,
          },
        },
      )
      .pipe(
        take(1),
        catchError(() => EMPTY),
      )
      .subscribe();
  }

  private getPayload(context: ExecutionContext): Record<string, unknown> {
    const data = context.switchToRpc().getData<unknown>();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  }

  private getPattern(context: ExecutionContext): string {
    const rpcContext = context.switchToRpc().getContext<{
      getSubject?: () => string;
      getPattern?: () => string;
    }>();
    return (
      rpcContext?.getSubject?.() ||
      rpcContext?.getPattern?.() ||
      `${context.getClass().name}.${context.getHandler().name}`
    );
  }

  private extractUserId(payload: Record<string, unknown>): string {
    const candidates = [
      payload.userId,
      payload.adminUserId,
      payload.id,
      (payload.user as { _id?: unknown } | undefined)?._id,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length === 24) return candidate;
    }
    return '000000000000000000000000';
  }
}
