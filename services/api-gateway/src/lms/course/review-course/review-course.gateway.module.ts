import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { ReviewCourseGatewayController } from './review-course.gateway.controller';
import { ReviewCourseGatewayService } from './review-course.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ReviewCourseGatewayController],
  providers: [ReviewCourseGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ReviewCourseGatewayModule {}
