import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { CourseGatewayController } from './course.gateway.controller';
import { CourseGatewayService } from './course.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [CourseGatewayController],
  providers: [CourseGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class CourseGatewayModule { }
