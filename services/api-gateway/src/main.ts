import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// import { LoggerService } from './common/services/logger.service';
import { SwaggerService } from './common/services/swagger.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import configuration from './common/config/configuration';

async function bootstrap() {
  // Initialize logger first to create logs directory
  // const loggerService = new LoggerService();

  const app = await NestFactory.create(AppModule, {
    // logger: loggerService,
  });

  // Security
  app.use(helmet());

  // CORS - will be configured in app.module.ts
  app.enableCors({
    origin:
      configuration().CORS_ORIGIN?.split(',') ||
      configuration().FRONTEND_ORIGIN,
    credentials: true,
    methods: configuration().CORS_METHODS?.split(',') || [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
    ],
    allowedHeaders: configuration().CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new RpcExceptionFilter());

  // Logging with morgan (for HTTP request logging to console)
  // File logging is handled by LoggerService and LoggingInterceptor
  if (configuration().NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Setup Swagger documentation
  const swaggerService = app.get(SwaggerService);
  swaggerService.setupSwagger(app);

  const port = configuration().PORT ?? 4000;
  await app.listen(port);
}

bootstrap().catch((err: NodeJS.ErrnoException) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${configuration().PORT ?? 4000} is already in use. Stop the other API Gateway process (or close its terminal) and try again.\n`,
    );
  } else {
    console.error('Bootstrap failed:', err);
  }
  process.exit(1);
});
