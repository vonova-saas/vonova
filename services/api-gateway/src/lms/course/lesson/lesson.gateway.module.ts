import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { LessonGatewayController } from './lesson.gateway.controller';
import { LessonResourcesGatewayController } from './lesson-resources.gateway.controller';
import { LessonGatewayService } from './lesson.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [LessonGatewayController, LessonResourcesGatewayController],
  providers: [LessonGatewayService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class LessonGatewayModule {}
