import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { CourseGatewayController } from './course.gateway.controller';
import { CourseGatewayService } from './course.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [CourseGatewayController],
  providers: [CourseGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class CourseGatewayModule {}
