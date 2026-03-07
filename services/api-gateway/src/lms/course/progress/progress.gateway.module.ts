import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { ProgressGatewayController } from './progress.gateway.controller';
import { ProgressGatewayService } from './progress.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ProgressGatewayController],
  providers: [ProgressGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ProgressGatewayModule {}
