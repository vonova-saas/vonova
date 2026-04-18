import { Module } from '@nestjs/common';
import { AuthGatewayService } from './auth.service';
import { AuthGatewayController } from './auth.controller';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Module({
  imports: [NatsClientModule],
  controllers: [AuthGatewayController],
  providers: [AuthGatewayService, JwtAuthGuard],
  exports: [AuthGatewayService, JwtAuthGuard],
})
export class AuthGatewayModule { }
