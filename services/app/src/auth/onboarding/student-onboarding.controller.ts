import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OnboardingService } from './onboarding.service';
import { SubmitStudentOnboardingDto } from '../dto/student-onboarding.dto';

@Controller()
export class StudentOnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @MessagePattern({ cmd: 'onboarding.student.submit' })
  submit(@Payload() dto: SubmitStudentOnboardingDto) {
    return this.onboardingService.submitStudentOnboarding(dto);
  }
}
