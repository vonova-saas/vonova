import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfigApp } from './common/config/mongo.config';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './auth/onboarding/onboarding.module';
import { AdminSeedModule } from './admin-seed/admin-seed.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { SettingsModule } from './settings/settings.module';
import { AccountModule } from './account/account.module';
import { BillingModule } from './billing/billing.module';
import { SupportModule } from './support/support.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { PostsModule } from './Community/posts/posts.module';
import { ArticlesModule } from './Community/articles/articles.module';
// import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => getMongoConfigApp(),
    }),
    //? App Models
    AuthModule,
    AdminAuthModule,
    AdminSettingsModule,
    AdminSeedModule,
    OnboardingModule,
    WaitlistModule,
    SettingsModule,
    AccountModule,
    BillingModule,
    //? Customer Support Modules
    SupportModule,
    FeedbackModule,
    AdminDashboardModule,
    PostsModule,
    ArticlesModule,
    // ChatbotModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
