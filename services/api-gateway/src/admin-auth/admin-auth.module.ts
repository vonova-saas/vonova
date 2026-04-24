import { Module } from '@nestjs/common';
import { NatsClientModule } from '../common/nats-client/nats-client.module';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminAuthGatewayController } from './admin-auth.controller';

@Module({
  imports: [NatsClientModule],
  controllers: [AdminAuthGatewayController],
  providers: [AdminJwtAuthGuard],
  exports: [],
})
export class AdminAuthGatewayModule {}
