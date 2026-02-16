import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import * as cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createWinstonConfig } from './config/logging.config';

async function bootstrap() {
  // Create Winston logger
  const winstonConfig = createWinstonConfig();

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  }));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Basic Authentication Middleware for Root and Swagger
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPassword = process.env.SWAGGER_PASSWORD || 'vonova2024';

  const basicAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Protect root route (/) and Swagger documentation (/api-docs)
    const isProtectedRoute = req.path === '/' ||
      req.path === '/health' ||
      req.path === '/roadmap/health' ||
      req.path === '/pdf-summary/health' ||
      req.path === '/api/v1/roadmap/health' ||
      req.path === '/api/v1/pdf-summary/health' ||
      req.path === '/roadmap/test-ai-connection' ||
      req.path.startsWith('/api-docs');

    if (isProtectedRoute) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Vonova LMS AI Platform"');
        return res.status(401).send('Unauthorized');
      }

      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (username !== swaggerUser || password !== swaggerPassword) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Vonova LMS AI Platform"');
        return res.status(401).send('Unauthorized');
      }
    }
    next();
  };

  // Apply basic authentication middleware
  app.use(basicAuthMiddleware);

  // Set global API prefix for versioning (excluding health endpoints)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/roadmap/health', '/pdf-summary/health']
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Vonova LMS AI Platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer(process.env.BASE_URL || 'http://localhost:4005', 'Production Server')
    .addServer('http://localhost:4005', 'Local Development Server')
    .addTag('Application', 'Application status and information')
    .addTag('Roadmap', 'AI-powered learning roadmap generation')
    .addTag('PDF Summary', 'AI-powered PDF summarization and chat')
    .addTag('Health', 'Health check endpoints')
    .addTag('Analytics', 'Query pattern analysis and insights')
    .addTag('Batch Operations', 'Bulk upload and delete operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 4005);

  console.log('\nVONOVA LMS AI PLATFORM - STARTING UP\n');
  console.log(`Backend Service: ${process.env.BASE_URL}`);
  console.log(`Roadmap AI Service: ${process.env.ROADMAP_AI_SERVICE_URL}`);
  console.log(`PDF Summary AI Service: ${process.env.PDF_SUMMARY_AI_SERVICE_URL}`);
  console.log(`API Documentation: ${process.env.URL_SERVER}/api-docs`);
  console.log(`Roadmap Health: ${process.env.URL_SERVER}/roadmap/health`);
  console.log(`PDF Summary Health: ${process.env.URL_SERVER}/pdf-summary/health`);
  console.log(`AI Connection Test: ${process.env.URL_SERVER}/roadmap/test-ai-connection`);
  console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server listening on port ${process.env.PORT || 4005}\n`);
  console.log('LMS AI PLATFORM IS READY!\n');
  console.log('Available Services:');
  console.log('AI Roadmap Generator');
  console.log('AI PDF Summary & Chat');
  console.log('AI Problem Solving (Coming Soon)');
  console.log('AI Assistant (Coming Soon)');
  console.log('AI Video Generator (Coming Soon)\n');
}

bootstrap();
