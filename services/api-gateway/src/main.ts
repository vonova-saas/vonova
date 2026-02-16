import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Env } from './config/env.config';
import { LoggerService } from './common/services/logger.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import expressBasicAuth from 'express-basic-auth';

async function bootstrap() {
  // Initialize logger first to create logs directory
  const loggerService = new LoggerService();
  
  const app = await NestFactory.create(AppModule, {
    logger: loggerService,
  });

  // Security
  app.use(helmet());

  // CORS - will be configured in app.module.ts
  app.enableCors({
    origin: Env.CORS_ORIGIN?.split(',') || Env.FRONTEND_ORIGIN,
    credentials: true,
    methods: Env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: Env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Logging with morgan (for HTTP request logging to console)
  // File logging is handled by LoggerService and LoggingInterceptor
  if (Env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vonova API Gateway')
    .setDescription(
      'API Gateway for Vonova microservices platform. ' +
      'This gateway provides a single entry point for all microservices, handling authentication, ' +
      'routing, and request proxying. The platform includes authentication, app services, LMS services, ' +
      'and AI-powered features like roadmap generation and PDF summarization.'
    )
    .setVersion('1.0.0')
    .setContact(
      'Vonova Company',
      'https://vonova.tech',
      'vonovacompany@gmail.com'
    )
    .setLicense('CC-BY-4.0', 'https://creativecommons.org/licenses/by/4.0/')
    .addServer(`http://localhost:${Env.PORT}`, 'Local Development Server')
    .addServer('https://api.vonova.tech', 'Production Server')
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Gateway', 'Gateway status and service management')
    .addTag('Health', 'Health check endpoints for gateway and services')
    .addTag('App Service', 'App service endpoints (proxied)')
    .addTag('LMS Service', 'LMS service endpoints (proxied)')
    .addTag('Roadmap AI', 'AI-powered learning roadmap generation')
    .addTag('PDF Summary', 'AI-powered PDF summarization and chat')
    // Cookie-based authentication (primary method)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT access token stored in HTTP-only cookie. Set automatically after login.',
      },
      'cookie'
    )
    // Bearer token authentication (alternative)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token (alternative to cookie-based auth). Use Authorization: Bearer <token> header.',
      },
      'bearer'
    );

  // Add basic auth for production Swagger UI protection
  if (Env.NODE_ENV === 'production' && Env.SWAGGER_USER && Env.SWAGGER_PASSWORD) {
    swaggerConfig.addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
        description: 'Basic authentication for Swagger UI access',
      },
      'basic'
    );
  }

  const config = swaggerConfig.build();
  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI options
  const swaggerOptions: any = {
    customSiteTitle: 'Vonova API Gateway Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  };

  // Add basic auth middleware for production
  if (Env.NODE_ENV === 'production' && Env.SWAGGER_USER && Env.SWAGGER_PASSWORD) {
    app.use(
      '/api-docs',
      expressBasicAuth({
        users: { [Env.SWAGGER_USER]: Env.SWAGGER_PASSWORD },
        challenge: true,
        realm: 'Vonova API Gateway',
      })
    );
  }

  SwaggerModule.setup('api-docs', app, document, swaggerOptions);

  const port = Env.PORT || 3000;

  try {
    await app.listen(port);
    loggerService.log('🚀 API Gateway started successfully');
    loggerService.log(`📍 Server running on port ${port}`);
    loggerService.log(`🌍 Environment: ${Env.NODE_ENV}`);
    loggerService.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
    loggerService.log(`📝 Logs directory: ${loggerService.logsDir}`);
    if (Env.NODE_ENV === 'production' && Env.SWAGGER_USER && Env.SWAGGER_PASSWORD) {
      loggerService.log(`🔐 Swagger UI protected with basic authentication`);
    }
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${port} is already in use.`);
      console.error(`💡 Solution: Stop the process using port ${port} or change the PORT in your .env file.`);
      console.error(`   To find and kill the process on Windows:`);
      console.error(`   1. Find process: netstat -ano | findstr :${port}`);
      console.error(`   2. Kill process: taskkill /PID <PID> /F`);
      process.exit(1);
    } else {
      console.error('❌ Error starting server:', error);
      process.exit(1);
    }
  }
}

bootstrap();

