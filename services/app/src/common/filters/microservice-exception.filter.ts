/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

interface RpcError {
  statusCode?: number;
  message?: string;
  error?: string;
}

@Catch(RpcException)
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const error = exception.getError() as RpcError;
    const status = error?.statusCode || 500;
    const message = error?.message || 'Internal server error';

    this.logger.error('RpcException caught', {
      error,
      status,
      message,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    response.status(status).json({
      statusCode: status,
      message,
      error: error?.error || 'RpcException',
      timestamp: new Date().toISOString(),
    });
  }
}
