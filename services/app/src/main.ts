import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import configuration from './common/config/configuration';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/rpc-exception.filter';
import { logMediaModeStartup } from './common/media/legacy-media-guard';

async function bootstrap() {
  const cfg = configuration();
  const natsUrl = cfg.NATS_URL?.trim();
  if (!natsUrl) {
    throw new Error('NATS_URL is required in .env');
  }
  // Internal-only service: NATS microservice (no public HTTP port)
  const natsApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        queue: cfg.NATS_QUEUE,
        ...(cfg.NATS_USER &&
          cfg.NATS_PASSWORD && {
            user: cfg.NATS_USER,
            pass: cfg.NATS_PASSWORD,
          }),
      },
    },
  );
  natsApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  natsApp.useGlobalFilters(new AllExceptionsFilter());
  await natsApp.listen();
  logMediaModeStartup('app');
}
bootstrap().catch((err: NodeJS.ErrnoException) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
