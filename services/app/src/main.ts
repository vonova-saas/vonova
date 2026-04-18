import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import configuration from './common/config/configuration';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const natsUrl = configuration().NATS_URL?.trim();
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
        ...(configuration().NATS_USER &&
          configuration().NATS_PASSWORD && {
          user: configuration().NATS_USER,
          pass: configuration().NATS_PASSWORD,
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
}
bootstrap().catch((err: NodeJS.ErrnoException) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
