import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
// import { LoggerService } from './common/services/logger.service';
import { SwaggerService } from './common/services/swagger.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import configuration from './common/config/configuration';

async function bootstrap() {
  // Initialize logger first to create logs directory
  // const loggerService = new LoggerService();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: loggerService,
  });

  // Railway/proxy deployments send X-Forwarded-* headers.
  // trust proxy must be enabled so rate-limit can identify real client IPs.
  const trustProxyConfig = configuration().TRUST_PROXY;
  const shouldTrustProxy =
    typeof trustProxyConfig === 'string'
      ? trustProxyConfig.toLowerCase() === 'true'
      : configuration().NODE_ENV === 'production';
  if (shouldTrustProxy) {
    app.set('trust proxy', 1);
  }

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  // CORS configuration
  const rawOrigins = configuration().CORS_ORIGIN;
  const parsedOrigins =
    rawOrigins != null && rawOrigins.trim() !== ''
      ? rawOrigins
        .split(',')
        .map((o) => o.trim().replace(/^"|"$/g, ''))
        .filter((o) => o.length > 0)
      : [];

  const origins =
    parsedOrigins.length > 0
      ? parsedOrigins
      : [configuration().FRONTEND_ORIGIN].filter(
        (o): o is string => typeof o === 'string' && o.length > 0,
      );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
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

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          const property = error.property;

          if (constraints) {
            const constraintMessages = Object.values(constraints);
            return constraintMessages.join(', ');
          }
          return `${property} validation failed`;
        });

        return new BadRequestException({
          statusCode: 400,
          message: messages[0] || 'Validation failed',
          error: 'Bad Request',
          details: errors,
        });
      },
    }),
  );
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

  const port = configuration().PORT;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT is required and must be a valid number in .env');
  }
  await app.listen(port);
}

bootstrap().catch((err: NodeJS.ErrnoException) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${configuration().PORT} is already in use. Stop the other API Gateway process (or close its terminal) and try again.\n`,
    );
  } else {
    console.error('Bootstrap failed:', err);
  }
  process.exit(1);
});
