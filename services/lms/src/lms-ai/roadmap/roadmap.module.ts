import { Module } from '@nestjs/common';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { DatabaseModule } from '../database/database.module';
import { UsageModule } from '../usage/usage.module';
import { AIUsageModule } from '../../ai-usage/ai-usage.module';

@Module({
  imports: [DatabaseModule, UsageModule, AIUsageModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
