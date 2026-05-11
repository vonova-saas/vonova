import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { PaymentsGatewayController } from './payments.gateway.controller';
import { PaymentsGatewayService } from './payments.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [PaymentsGatewayController],
  providers: [PaymentsGatewayService, JwtAuthGuard, RolesGuard],
  exports: [PaymentsGatewayService],
})
export class PaymentsGatewayModule {}
