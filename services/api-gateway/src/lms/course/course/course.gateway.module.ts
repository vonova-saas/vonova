import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { CourseGatewayController } from './course.gateway.controller';
import { CourseGatewayService } from './course.gateway.service';
import { S3Service } from 'src/common/utils/storage/s3.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [CourseGatewayController],
  providers: [CourseGatewayService, JwtAuthGuard, S3Service],
  exports: [JwtAuthGuard, CourseGatewayService, S3Service],
})
export class CourseGatewayModule {}
