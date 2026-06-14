import { Module } from '@nestjs/common';
import { CommunityProfileIntegrationController } from './community-profile-integration.controller';
import { CommunityGatewayModule } from './community.module';
import { EnrollGatewayModule } from '../../lms/course/enroll/enroll.gateway.module';
import { CourseGatewayModule } from '../../lms/course/course/course.gateway.module';
import { AuthGatewayModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    AuthGatewayModule,
    CommunityGatewayModule,
    EnrollGatewayModule,
    CourseGatewayModule,
  ],
  controllers: [CommunityProfileIntegrationController],
  providers: [JwtAuthGuard],
})
export class CommunityProfileIntegrationModule {}
