import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import configuration from './common/config/configuration';
import { AllExceptionsFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const config = configuration();
  let natsUrl = config.NATS_URL || 'nats://localhost:4222';
  if (
    !natsUrl ||
    typeof natsUrl !== 'string' ||
    natsUrl.trim() === '' ||
    !natsUrl.startsWith('nats://')
  ) {
    natsUrl = 'nats://localhost:4222';
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        queue: 'vonova-lms-queue',
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();

  console.log('\n--- Vonova LMS (LMS + LMS-AI) ---');
  console.log(`NATS: ${natsUrl}`);
  console.log(`Queue: vonova-lms-queue (one request → one instance)`);
  console.log(`Env:  ${config.NODE_ENV ?? 'development'}`);
  console.log(
    'Handlers: courses, quizzes, library, assignments, enroll, progress',
  );
  console.log('         roadmap (AI), pdf-summary (AI)\n');
}

bootstrap().catch((err) => {
  console.error('LMS bootstrap failed:', err);
  process.exit(1);
});
