import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { ProgressGatewayController } from './progress.gateway.controller';
import { ProgressGatewayService } from './progress.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ProgressGatewayController],
  providers: [ProgressGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ProgressGatewayModule {}
