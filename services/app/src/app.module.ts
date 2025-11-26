import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettingsModule } from './settings/settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from './settings/account/account/account.module';
import { BillingModule } from './settings/billing/billing.module';


@Module({
  imports: [
    SettingsModule,
    AccountModule,
    BillingModule,
    MongooseModule.forRoot('mongodb://localhost:27017/app')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
