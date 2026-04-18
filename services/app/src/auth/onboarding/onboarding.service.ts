import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { User, UserDocument } from '../schema/user.schema';
import { Role } from '../enums/role.enum';
import { UserAccountStatus } from '../enums/user-account-status.enum';
import { InstructorCvS3Service } from '../../common/storage/instructor-cv-s3.service';
import { SubmitStudentOnboardingDto } from '../dto/student-onboarding.dto';
import { SubmitInstructorOnboardingDto } from '../dto/instructor-onboarding.dto';

@Injectable()
export class OnboardingService {
  private static readonly CV_MAX_BYTES = 5 * 1024 * 1024;
  private static readonly CV_ALLOWED_MIMES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly instructorCvS3Service: InstructorCvS3Service,
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  private assertInstructorCvFileMeta(file: {
    mimetype?: string;
    originalname?: string;
  }) {
    const ext = (file.originalname?.split('.').pop() || '').toLowerCase();
    const extOk = ['pdf', 'doc', 'docx'].includes(ext);
    const mime = (file.mimetype || '').toLowerCase();
    const mimeOk = OnboardingService.CV_ALLOWED_MIMES.has(mime);
    if (!extOk && !mimeOk) {
      throw new RpcException({
        statusCode: 400,
        message: 'CV must be a PDF, DOC, or DOCX file',
        error: 'Bad Request',
      });
    }
  }

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

    if (!dto.file?.buffer || !dto.file.originalname) {
      throw new RpcException({
        statusCode: 400,
        message: 'CV file is required',
        error: 'Bad Request',
      });
    }

    this.assertInstructorCvFileMeta({
      mimetype: dto.file.mimetype,
      originalname: dto.file.originalname,
    });

    const rawBuffer = dto.file.buffer;
    const buffer =
      typeof rawBuffer === 'string'
        ? Buffer.from(rawBuffer, 'base64')
        : Buffer.isBuffer(rawBuffer)
          ? rawBuffer
          : Buffer.from(String(rawBuffer), 'base64');

    if (buffer.length > OnboardingService.CV_MAX_BYTES) {
      throw new RpcException({
        statusCode: 400,
        message: 'CV file must not exceed 5MB',
        error: 'Bad Request',
      });
    }

    let cvUrl: string;
    try {
      cvUrl = await this.instructorCvS3Service.uploadCv({
        userId: String(user._id),
        buffer,
        contentType: dto.file.mimetype || 'application/octet-stream',
        originalName: dto.file.originalname,
      });
    } catch {
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to upload CV to storage',
        error: 'Internal Server Error',
      });
    }

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
