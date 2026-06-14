import { Module } from '@nestjs/common';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { CommunitySocketGateway } from './community.gateway';

@Module({
  imports: [AuthGatewayModule, NatsClientModule],
  providers: [CommunitySocketGateway],
  exports: [CommunitySocketGateway],
})
export class CommunitySocketGatewayModule {}
