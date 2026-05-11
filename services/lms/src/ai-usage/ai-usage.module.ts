import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIUsageService } from './ai-usage.service';
import { AIUsageController } from './ai-usage.controller';
import { AIUsage, AIUsageSchema } from './schema/ai-usage.schema';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIUsage.name, schema: AIUsageSchema },
    ]),
    SubscriptionModule,
  ],
  controllers: [AIUsageController],
  providers: [AIUsageService],
  exports: [AIUsageService],
})
export class AIUsageModule {}
