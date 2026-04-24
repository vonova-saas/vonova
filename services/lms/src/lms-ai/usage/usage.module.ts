import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DailyUsageLimitService } from './daily-usage-limit.service';

@Module({
  imports: [DatabaseModule],
  providers: [DailyUsageLimitService],
  exports: [DailyUsageLimitService],
})
export class UsageModule {}
