import { Module } from '@nestjs/common';
import { NatsClientModule } from '../common/nats-client/nats-client.module';
import { AdminAuthGatewayController } from './admin-auth.controller';

@Module({
  imports: [NatsClientModule],
  controllers: [AdminAuthGatewayController],
  providers: [],
  exports: [],
})
export class AdminAuthGatewayModule {}
