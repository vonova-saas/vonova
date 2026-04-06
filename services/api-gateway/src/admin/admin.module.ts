import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AdminGatewayController } from './admin.controller';
import { AdminGatewayService } from './admin.service';

@Module({
  imports: [NatsClientModule],
  controllers: [AdminGatewayController],
  providers: [AdminGatewayService],
})
export class AdminGatewayModule {}
