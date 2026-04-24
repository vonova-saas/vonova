import { Module } from '@nestjs/common';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { DatabaseModule } from '../database/database.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [DatabaseModule, UsageModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
