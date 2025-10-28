import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import * as cors from 'cors';
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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Vonova LMS AI Platform')
    .setDescription('AI-powered learning platform with roadmap generation, PDF summarization, and more')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Application', 'Application status and information')
    .addTag('Roadmap', 'AI-powered learning roadmap generation')
    .addTag('PDF Summary', 'AI-powered PDF summarization and chat')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4005;
  await app.listen(port);

  console.log('\nVONOVA LMS AI PLATFORM - STARTING UP\n');
  console.log(`Backend Service: http://localhost:${port}`);
  console.log('Roadmap AI Service: https://vonova-ai-roadmap.up.railway.app');
  console.log('PDF Summary AI Service: https://vonova-ai-pdfsummary.up.railway.app');
  console.log(`API Documentation: http://localhost:${port}/api-docs`);
  console.log(`Roadmap Health: http://localhost:${port}/roadmap/health`);
  console.log(`PDF Summary Health: http://localhost:${port}/pdf-summary/health`);
  console.log(`AI Connection Test: http://localhost:${port}/roadmap/test-ai-connection`);
  console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server listening on port ${port}\n`);
  console.log('LMS AI PLATFORM IS READY!\n');
  console.log('Available Services:');
  console.log('AI Roadmap Generator');
  console.log('AI PDF Summary & Chat');
  console.log('AI Problem Solving (Coming Soon)');
  console.log('AI Assistant (Coming Soon)');
  console.log('AI Video Generator (Coming Soon)\n');
}

bootstrap();
