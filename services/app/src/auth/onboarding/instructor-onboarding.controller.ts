import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OnboardingService } from './onboarding.service';
import { SubmitInstructorOnboardingDto } from '../dto/instructor-onboarding.dto';

@Controller()
export class InstructorOnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @MessagePattern({ cmd: 'onboarding.instructor.submit' })
  submit(@Payload() dto: SubmitInstructorOnboardingDto) {
    return this.onboardingService.submitInstructorOnboarding(dto);
  }
}
