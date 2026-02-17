import { Module } from '@nestjs/common';
import { FeedbackGatewayController } from './feedback.controller';
import { FeedbackGatewayService } from './feedback.service';
import { AuthGatewayModule } from '../auth/auth.module';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [FeedbackGatewayController],
  providers: [FeedbackGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class FeedbackGatewayModule {}
