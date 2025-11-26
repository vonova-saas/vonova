import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { MulterModule } from '@nestjs/platform-express';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoadmapModule } from './roadmap/roadmap.module';
import { PdfSummaryModule } from './pdf-summary/pdf-summary.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';

import { CorsMiddleware } from './common/middleware/cors.middleware';
import { BotProtectionMiddleware } from './common/middleware/bot-protection.middleware';
import { createWinstonConfig } from './config/logging.config';
import { envConfig } from './config/env.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Logging
    WinstonModule.forRoot(createWinstonConfig()),

    // Database
    DatabaseModule,

    // File upload
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),

    // Feature modules
    RoadmapModule,
    PdfSummaryModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes('*');

    consumer
      .apply(BotProtectionMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'api-docs', method: RequestMethod.GET },
        { path: 'api-docs/(.*)', method: RequestMethod.GET },
        { path: 'roadmap/health', method: RequestMethod.GET },
        { path: 'pdf-summary/health', method: RequestMethod.GET },
        { path: 'roadmap/test-ai-connection', method: RequestMethod.GET },
        { path: 'roadmap/system-status', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
