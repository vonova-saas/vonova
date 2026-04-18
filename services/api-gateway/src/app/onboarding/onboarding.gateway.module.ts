import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AuthGatewayModule } from '../auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OnboardingGatewayService } from './onboarding-gateway.service';
import { StudentOnboardingGatewayController } from './student-onboarding.gateway.controller';
import { InstructorOnboardingGatewayController } from './instructor-onboarding.gateway.controller';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [
    StudentOnboardingGatewayController,
    InstructorOnboardingGatewayController,
  ],
  providers: [OnboardingGatewayService, JwtAuthGuard],
})
export class OnboardingGatewayModule {}
