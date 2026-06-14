import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AIUsageService } from './ai-usage.service';
import { AIUsageController } from './ai-usage.controller';
import { AIUsage, AIUsageSchema } from './schema/ai-usage.schema';
import { AiUsageLedger, AiUsageLedgerSchema } from './schema/ai-usage-ledger.schema';
import { AiIdempotency, AiIdempotencySchema } from './schema/ai-idempotency.schema';
import { AiCreditService } from './ai-credit.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    ConfigModule, // Required by AiCreditService for feature flag
    MongooseModule.forFeature([
      // Legacy daily schema (kept for backward compatibility)
      { name: AIUsage.name, schema: AIUsageSchema },
      // V2: Monthly ledger — single source of truth
      { name: AiUsageLedger.name, schema: AiUsageLedgerSchema },
      // V2: Idempotency dedup (24h TTL)
      { name: AiIdempotency.name, schema: AiIdempotencySchema },
    ]),
    SubscriptionModule,
  ],
  controllers: [AIUsageController],
  providers: [
    // Legacy service (kept — do NOT remove yet)
    AIUsageService,
    // V2: Central enforcement layer
    AiCreditService,
  ],
  exports: [
    AIUsageService,
    // Export V2 service so AI feature modules can inject it
    AiCreditService,
  ],
})
export class AIUsageModule {}

