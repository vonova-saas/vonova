import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import configuration from './common/config/configuration';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  // Create HTTP app for testing with Postman
  const httpApp = await NestFactory.create(AppModule);
  httpApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  httpApp.useGlobalFilters(new AllExceptionsFilter());
  await httpApp.listen(4001);

  // Create NATS microservice
  const natsApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [configuration().NATS_URL || 'nats://localhost:4222'],
        // user: configuration().NATS_USER,
        // pass: configuration().NATS_PASSWORD,
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
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
