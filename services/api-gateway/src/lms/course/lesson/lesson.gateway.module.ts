import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { LessonGatewayController } from './lesson.gateway.controller';
import { LessonGatewayService } from './lesson.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [LessonGatewayController],
  providers: [LessonGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class LessonGatewayModule {} 
