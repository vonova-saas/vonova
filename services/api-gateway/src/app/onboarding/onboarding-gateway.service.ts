import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { StudentOnboardingBodyDto } from './dto/student-onboarding.dto';

@Injectable()
export class OnboardingGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  submitStudent(userId: string, dto: StudentOnboardingBodyDto) {
    return this.client.send({ cmd: 'onboarding.student.submit' }, {
      userId,
      track: dto.track,
      level: dto.level,
      goal: dto.goal,
      experience: dto.experience,
      timeCommitment: dto.timeCommitment,
    });
  }

  submitInstructor(payload: {
    userId: string;
    track: string;
    experienceYears: number;
    bio: string;
    teachingStyle: string;
    motivation: string;
    file: {
      originalname: string;
      mimetype: string;
      buffer: string;
    };
  }) {
    return this.client.send({ cmd: 'onboarding.instructor.submit' }, payload);
  }
}
