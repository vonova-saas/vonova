import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { CourseFeedbackGatewayService } from './feedback.gateway.service';
import { CourseFeedbackGatewayController } from './feedback.gateway.controller';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [CourseFeedbackGatewayController],
  providers: [CourseFeedbackGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class CourseFeedbackGatewayModule {}