import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthController } from './common/controllers/health.controller';
import {
  AppServiceProxyController,
  AccountProxyController,
  BillingProxyController,
  FeedbackProxyController,
  SettingsProxyController,
  SupportProxyController,
  LmsServiceProxyController,
  AssignmentProxyController,
  QuizProxyController,
  CourseProxyController,
  LibraryProxyController,
  RoadmapAiProxyController,
  PdfSummaryAiProxyController,
} from './common/controllers/proxy-routes.controller';
import { GatewayProxyMiddleware } from './common/middleware/gateway-proxy.middleware';
import { LoggerService } from './common/services/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Env } from './config/env.config';
import { NatsModule } from './common/services/nats.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => Env],
    }),

    // Database
    DatabaseModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(Env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
        limit: parseInt(Env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    ]),

    // NATS messaging (global)
    NatsModule,

    // Feature modules
    AuthModule,
    GatewayModule, // GatewayModule exports GatewayService for middleware
  ],
  controllers: [
    AppController,
    HealthController,
    AppServiceProxyController,
    AccountProxyController,
    BillingProxyController,
    FeedbackProxyController,
    SettingsProxyController,
    SupportProxyController,
    LmsServiceProxyController,
    AssignmentProxyController,
    QuizProxyController,
    CourseProxyController,
    LibraryProxyController,
    RoadmapAiProxyController,
    PdfSummaryAiProxyController,
  ],
  providers: [
    AppService,
    ConfigService,
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GatewayProxyMiddleware)
      .forRoutes('*');
  }
}

