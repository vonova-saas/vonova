import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { ReviewGatewayController } from './review.gateway.controller';
import { ReviewGatewayService } from './review.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ReviewGatewayController],
  providers: [ReviewGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ReviewGatewayModule {}
