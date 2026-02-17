import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { NatsClientModule } from './common/nats-client/nats-client.module';
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { BotProtectionMiddleware } from './common/middleware/bot-protection.middleware';
import { SwaggerService } from './common/services/swagger.service';
import { LoggerService } from './common/services/logger.service';
import { WaitlistGatewayModule } from './app/waitlist/waitlist.module';
import { SettingsGatewayModule } from './app/settings/settings.module';
import { AccountGatewayModule } from './app/account/account.module';
import { BillingGatewayModule } from './app/billing/billing.module';
import { SupportGatewayModule } from './app/support/support.module';
import { FeedbackGatewayModule } from './app/feedback/feedback.module';
import { AuthGatewayModule } from './app/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    // Nats Client
    NatsClientModule,
    //* App Services
    WaitlistGatewayModule,
    AuthGatewayModule,
    SettingsGatewayModule,
    AccountGatewayModule,
    BillingGatewayModule,
    SupportGatewayModule,
    FeedbackGatewayModule,
    //* LMS Services
    //* LMS AI Services
    //* Generative AI Services
  ],
  controllers: [AppController],
  providers: [SwaggerService, LoggerService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');

    consumer
      .apply(BotProtectionMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'app/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
