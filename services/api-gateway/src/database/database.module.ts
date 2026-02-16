import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Env } from '../config/env.config';

@Module({
  imports: [
    MongooseModule.forRoot(Env.MONGO_URI_REMOTE, {
      // Add any mongoose options here if needed
    }),
  ],
})
export class DatabaseModule {}

