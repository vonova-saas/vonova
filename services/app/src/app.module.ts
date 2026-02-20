import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from './account/account.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import configuration from './common/config/configuration';
import { FeedbackModule } from './feedback/feedback.module';
import { SettingsModule } from './settings/settings.module';
import { SupportModule } from './support/support.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { getMongoConfig } from './common/config/mongo.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    // MongooseModule.forRoot(configuration().MONGO_URI_LOCAL!),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [],
    }),
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
