import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../../app/auth/auth.module';
import { QuizGatewayController } from './quiz.gateway.controller';
import { QuizGatewayService } from './quiz.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [QuizGatewayController],
  providers: [QuizGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class QuizGatewayModule { }
