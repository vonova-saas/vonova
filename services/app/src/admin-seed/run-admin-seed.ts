import 'dotenv/config';
/**
 * Manual admin seed CLI:
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/run-admin-seed.ts
 * Or after build:
 *   node dist/admin-seed/run-admin-seed.js
 *
 * Requires MongoDB and env vars (same as main app). Does not start NATS.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminSeederService } from './admin-seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const seeder = app.get(AdminSeederService);
    await seeder.seed();
  } finally {
    await app.close();
  }
}

bootstrap().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
