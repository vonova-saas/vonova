import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { PresentationGatewayController } from './presentation.gateway.controller';
import { PresentationGatewayService } from './presentation.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [PresentationGatewayController],
  providers: [PresentationGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class PresentationGatewayModule {}
