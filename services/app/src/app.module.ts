import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettingsModule } from './settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [SettingsModule,
    MongooseModule.forRoot('mongodb://localhost:27017/app')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
