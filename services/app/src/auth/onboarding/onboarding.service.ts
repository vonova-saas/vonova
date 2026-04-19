import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { User, UserDocument } from '../schema/user.schema';
import { Role } from '../enums/role.enum';
import { UserAccountStatus } from '../enums/user-account-status.enum';
import { SubmitStudentOnboardingDto } from '../dto/student-onboarding.dto';
import { SubmitInstructorOnboardingDto } from '../dto/instructor-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  private async loadUserForOnboarding(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }
    if (user.role === Role.ADMIN) {
      throw new RpcException({
        statusCode: 400,
        message: 'Onboarding is not applicable to administrator accounts',
        error: 'Bad Request',
      });
    }
    if (user.role === Role.PENDING) {
      throw new RpcException({
        statusCode: 400,
        message: 'Complete welcome (role selection) before onboarding',
        error: 'Bad Request',
      });
    }
    if (user.onboardingCompleted === true) {
      throw new RpcException({
        statusCode: 400,
        message: 'Onboarding already completed',
        error: 'Bad Request',
      });
    }
    return user;
  }

  async submitStudentOnboarding(dto: SubmitStudentOnboardingDto) {
    const user = await this.loadUserForOnboarding(dto.userId);
    if (user.role !== Role.STUDENT_USER) {
      throw new RpcException({
        statusCode: 400,
        message: 'This endpoint is only for student accounts',
        error: 'Bad Request',
      });
    }

    user.onboarding = {
      ...user.onboarding,
      student: {
        track: dto.track.trim(),
        level: dto.level.trim(),
        goal: dto.goal.trim(),
        experience: dto.experience.trim(),
        timeCommitment: dto.timeCommitment.trim(),
      },
    };
    user.onboardingCompleted = true;
    user.status = UserAccountStatus.ACTIVE;
    await user.save();

    return {
      message: 'Student onboarding completed successfully',
      data: {
        onboardingCompleted: true,
        status: user.status,
        onboarding: user.onboarding,
      },
    };
  }

  async submitInstructorOnboarding(dto: SubmitInstructorOnboardingDto) {
    const user = await this.loadUserForOnboarding(dto.userId);
    if (user.role !== Role.INSTRUCTOR_USER) {
      throw new RpcException({
        statusCode: 400,
        message: 'This endpoint is only for instructor accounts',
        error: 'Bad Request',
      });
    }

    const cvUrl = dto.cvUrl.trim();

    user.onboarding = {
      ...user.onboarding,
      instructor: {
        track: dto.track.trim(),
        experienceYears: dto.experienceYears,
        bio: dto.bio.trim(),
        teachingStyle: dto.teachingStyle.trim(),
        motivation: dto.motivation.trim(),
      },
    };
    user.cvUrl = cvUrl;
    user.onboardingCompleted = true;
    user.status = UserAccountStatus.PENDING;
    await user.save();

    void firstValueFrom(
      this.natsClient.send(
        { cmd: 'admin.notification.instructorApplication' },
        {
          userId: String(user._id),
          message: 'New instructor application submitted',
        },
      ),
    ).catch(() => undefined);

    return {
      message:
        'Instructor onboarding completed; your account is pending review',
      data: {
        onboardingCompleted: true,
        status: user.status,
        cvUrl,
        onboarding: user.onboarding,
      },
    };
  }
}
