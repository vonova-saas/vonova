import { Module } from '@nestjs/common';
import { SupportGatewayController } from './support.controller';
import { SupportGatewayService } from './support.service';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AuthGatewayModule } from '../auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [SupportGatewayController],
  providers: [SupportGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class SupportGatewayModule {}
