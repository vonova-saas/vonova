import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { CommunityGatewayModule } from 'src/app/community/community.module';
import { CommunitySocketGatewayModule } from 'src/community/socket/community.gateway.module';
import { EnrollGatewayController } from './enroll.gateway.controller';
import { EnrollGatewayService } from './enroll.gateway.service';
import { StudentEnrollmentsGatewayController } from './student-enrollments.gateway.controller';
import { InstructorCourseAnalyticsGatewayController } from './instructor-course-analytics.gateway.controller';
import { CourseGatewayModule } from '../course/course.gateway.module';

@Module({
  imports: [
    NatsClientModule,
    AuthGatewayModule,
    CourseGatewayModule,
    CommunityGatewayModule,
    CommunitySocketGatewayModule,
  ],
  controllers: [
    EnrollGatewayController,
    StudentEnrollmentsGatewayController,
    InstructorCourseAnalyticsGatewayController,
  ],
  providers: [EnrollGatewayService, JwtAuthGuard, RolesGuard],
  exports: [EnrollGatewayService, JwtAuthGuard, RolesGuard],
})
export class EnrollGatewayModule {}
