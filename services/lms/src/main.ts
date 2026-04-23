import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import configuration from './common/config/configuration';
import { AllExceptionsFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const config = configuration();
  const natsUrl = config.NATS_URL?.trim();
  if (!natsUrl) {
    throw new Error('NATS_URL is required in .env');
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        queue: 'vonova-lms-queue',
        ...(config.NATS_USER &&
          config.NATS_PASSWORD && {
            user: config.NATS_USER,
            pass: config.NATS_PASSWORD,
          }),
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
  console.log(`Env:  ${config.NODE_ENV}`);
  console.log(
    'Handlers: courses, quizzes, library, assignments, enroll, progress',
  );
  console.log('         roadmap (AI), pdf-summary (AI)\n');
}

bootstrap().catch((err) => {
  console.error('LMS bootstrap failed:', err);
  process.exit(1);
});
