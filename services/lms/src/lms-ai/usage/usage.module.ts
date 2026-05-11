import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AIUsageModule } from '../../ai-usage/ai-usage.module';
import { DailyUsageLimitService } from './daily-usage-limit.service.refactored';

/**
 * Usage Module - Refactored to use centralized AIUsageService
 *
 * This module provides backward-compatible DailyUsageLimitService
 * that now delegates to the centralized AIUsageService with
 * subscription-based limits (Free: 1/day, Pro: Unlimited).
 */
@Module({
  imports: [DatabaseModule, AIUsageModule],
  providers: [DailyUsageLimitService],
  exports: [DailyUsageLimitService],
})
export class UsageModule { }
