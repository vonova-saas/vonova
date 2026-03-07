import { Module } from '@nestjs/common';
import { BillingGatewayController } from './billing.controller';
import { BillingGatewayService } from './billing.service';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [BillingGatewayController],
  providers: [BillingGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class BillingGatewayModule { }
