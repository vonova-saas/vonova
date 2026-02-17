import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { AccountModule } from './account/account.module';
import { BillingModule } from './billing/billing.module';
import { SupportModule } from './support/support.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WaitlistModule } from './waitlist/waitlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().MONGO_URI_LOCAL!),
    //? App Models
    AuthModule,
    WaitlistModule,
    SettingsModule,
    AccountModule,
    BillingModule,
    //? Customer Support Modules
    SupportModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
