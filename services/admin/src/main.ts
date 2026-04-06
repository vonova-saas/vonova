import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // NATS microservice configuration
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.NATS,
    options: {
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      queue: 'admin_queue',
    },
  };

  // Connect as microservice (no HTTP server)
  app.connectMicroservice(microserviceOptions);
  await app.startAllMicroservices();

  console.log(' Admin Service started as NATS microservice');
  console.log(` Connected to NATS at ${process.env.NATS_URL || 'nats://localhost:4222'}`);
  console.log(' Service ready for API Gateway communication');
}

bootstrap();
