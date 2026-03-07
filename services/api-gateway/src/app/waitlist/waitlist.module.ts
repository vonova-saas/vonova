import { Module } from '@nestjs/common';
import { WaitlistGatewayService } from './waitlist.service';
import { WaitlistGatewayController } from './waitlist.controller';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';

@Module({
  imports: [NatsClientModule],
  controllers: [WaitlistGatewayController],
  providers: [WaitlistGatewayService],
})
export class WaitlistGatewayModule { }
