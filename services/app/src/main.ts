import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Env } from './config/env.config';
import { appLogger } from './utils/logger';
import { validateEnvironmentVariables } from './config/env-validation';

// Load .env file manually before validation (ConfigModule loads it later, but we need it now)
// Try .env.local first, then .env
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

let envLoaded = false;
if (fs.existsSync(envLocalPath)) {
  const result = dotenv.config({ path: envLocalPath });
  envLoaded = !result.error;
  if (result.error) {
    console.warn('Warning: Failed to load .env.local:', result.error.message);
  }
} else if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  envLoaded = !result.error;
  if (result.error) {
    console.warn('Warning: Failed to load .env:', result.error.message);
  }
} else {
  // Try default dotenv behavior (looks for .env in cwd)
  const result = dotenv.config();
  envLoaded = !result.error;
  if (
    result.error &&
    (result.error as NodeJS.ErrnoException).code !== 'ENOENT'
  ) {
    console.warn('Warning: Failed to load .env:', result.error.message);
  }
}

// Debug: Log if .env file was found and loaded
if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
  console.error('\n ERROR: No .env file found!');
  console.error('   Location checked:', envPath);
  console.error('\n   To fix this:');
  console.error('   1. Create a .env file in services/app/');
  console.error('   2. Add JWT_ACCESS_SECRET and JWT_REFRESH_SECRET');
  console.error('   3. Then restart the application\n');
} else if (envLoaded) {
  console.log('✓ .env file loaded successfully');
  // Verify critical environment variables are loaded
  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET) {
    console.log('✓ JWT secrets loaded successfully');
  } else {
    console.warn('⚠ WARNING: JWT secrets not found in environment variables');
    console.warn(
      '   JWT_ACCESS_SECRET:',
      process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET',
    );
    console.warn(
      '   JWT_REFRESH_SECRET:',
      process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
    );
  }
}

async function bootstrap() {
  // Validate environment variables before starting the application
  try {
    validateEnvironmentVariables();
  } catch {
    appLogger.error(
      'Failed to start application due to missing environment variables',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: Env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: Env.CORS_METHODS?.split(',') || [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
    ],
    allowedHeaders: Env.CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
    credentials: Env.CORS_CREDENTIALS === 'true',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Cookie parser
  app.use(cookieParser());

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation with basic auth protection
  if (Env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Vonova App Service API')
      .setDescription('Combined app + auth service for the Vonova platform.')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(
        process.env.BASE_URL || 'http://localhost:4001',
        'Local Development Server',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Basic auth middleware for Swagger UI (optional if creds are set)
    if (Env.SWAGGER_USER && Env.SWAGGER_PASSWORD) {
      app.use(
        '/api-docs',
        basicAuth({
          users: { [Env.SWAGGER_USER]: Env.SWAGGER_PASSWORD },
          challenge: true,
          realm: 'Vonova API Documentation',
        }),
      );
    }

    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Vonova App Service API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  await app.listen(Env.PORT ? Number(Env.PORT) : 4001);

  const nodeEnv = Env.NODE_ENV || process.env.NODE_ENV || 'development';
  const port = Env.PORT || process.env.PORT || '4001';

  appLogger.log(`App service running on port ${port} (env: ${nodeEnv})`);
  if (nodeEnv !== 'production') {
    appLogger.log(`API Docs: http://localhost:${port}/api-docs`);
  }
}

void bootstrap();
