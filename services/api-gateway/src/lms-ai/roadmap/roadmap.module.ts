import { Module } from '@nestjs/common';
import { RoadmapGatewayController } from './roadmap.controller';
import { RoadmapGatewayService } from './roadmap.service';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillingGatewayModule } from '../../app/billing/billing.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule, BillingGatewayModule],
  controllers: [RoadmapGatewayController],
  providers: [RoadmapGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class RoadmapGatewayModule {}
