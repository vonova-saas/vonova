import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettingsModule } from './settings/settings/settings.module';
import { AccountModule } from './settings/account/account/account.module';
import { BillingModule } from './settings/billing/billing.module';
import { SupportModule } from './settings/supoort/supoort.module';
import { FeedbackModule } from './settings/feedback/feedback.module';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
    DatabaseModule,
    AuthModule,
    SettingsModule,
    AccountModule,
    BillingModule,
    SupportModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
