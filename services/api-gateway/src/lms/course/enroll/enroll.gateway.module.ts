import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { EnrollGatewayController } from './enroll.gateway.controller';
import { EnrollGatewayService } from './enroll.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [EnrollGatewayController],
  providers: [EnrollGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class EnrollGatewayModule {}
