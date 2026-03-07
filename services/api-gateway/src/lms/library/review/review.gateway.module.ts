import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { ReviewGatewayController } from './review.gateway.controller';
import { ReviewGatewayService } from './review.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ReviewGatewayController],
  providers: [ReviewGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ReviewGatewayModule {}
