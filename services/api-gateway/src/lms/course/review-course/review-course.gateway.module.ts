import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { ReviewCourseGatewayController } from './review-course.gateway.controller';
import { ReviewCourseGatewayService } from './review-course.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ReviewCourseGatewayController],
  providers: [ReviewCourseGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ReviewCourseGatewayModule {}
