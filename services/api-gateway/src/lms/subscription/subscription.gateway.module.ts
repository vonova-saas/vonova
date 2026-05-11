import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { SubscriptionGatewayController } from './subscription.gateway.controller';
import { SubscriptionGatewayService } from './subscription.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [SubscriptionGatewayController],
  providers: [SubscriptionGatewayService, JwtAuthGuard, RolesGuard],
  exports: [SubscriptionGatewayService],
})
export class SubscriptionGatewayModule {}
