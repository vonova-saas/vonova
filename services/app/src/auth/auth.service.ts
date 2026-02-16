import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from './schemas/user.schema';
import { Account, AccountDocument } from './schemas/account.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schemas/email-verification.schema';
import {
  PasswordReset,
  PasswordResetDocument,
} from './schemas/password-reset.schema';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@app/utils/appError';
import { generateDeviceHash, hashValue } from '@app/utils/bcrypt';
import {
  AccessTPayload,
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyAccessToken,
  verifyJwtToken,
} from '@app/utils/jwt';
import { EmailService } from './email.service';
import { ProviderEnum } from '@app/enums/account-provider.enum';
import { Roles } from '@app/enums/role.enum';
import { RolePermissions } from '@app/utils/role-permission';
import { createLogger } from '@app/utils/logger';

@Injectable()
export class AuthService {
  private readonly logger = createLogger('AuthService');

  constructor(
    @InjectModel(User.name)
    private userModel: Model<
      UserDocument & {
        comparePassword: (value: string) => Promise<boolean>;
        omitPassword: () => any;
      }
    >,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(EmailVerification.name)
    private emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(PasswordReset.name)
    private passwordResetModel: Model<PasswordResetDocument>,
    private emailService: EmailService,
  ) { }

  async registerUser(body: { name: string; email: string; password: string }) {
    const { email, name, password } = body;

    this.logger.logAuth('Registration attempt', { email, name });

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      this.logger.warn('Registration failed: Email already exists', { email });
      throw new BadRequestException('Email already exist');
    }

    const user = new this.userModel({
      name,
      email,
      password,
      role: Roles.PENDING,
    });
    await user.save();

    const account = new this.accountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await account.save();

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.emailVerificationModel.create({
      email,
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await this.emailService.sendVerificationEmail(user.email, verificationCode);

    this.logger.logAuth('User registered successfully', {
      userId: user._id,
      email,
    });

    return {
      message:
        'User registered successfully, you will receive a verification email.',
    };
  }

  async verifyEmailCode(email: string, otp_code: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const verificationRecord = await this.emailVerificationModel.findOne({
      email,
      verificationCode: otp_code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    verificationRecord.used = true;
    await verificationRecord.save();

    user.isVerified = true;
    await user.save();

    return {
      message: 'Email verified successfully',
    };
  }

  async welcomeUserEmail(body: {
    email: string;
    userAgent: string;
    role: string;
    answerOne: string;
    answerTwo?: string;
    answerThree?: string;
    answerFour?: string;
    answerFive?: string;
    cvUrl?: string;
  }) {
    const {
      email,
      userAgent,
      role,
      answerOne,
      answerTwo,
      answerThree,
      answerFour,
      answerFive,
      cvUrl,
    } = body;

    const account = await this.accountModel.findOne({
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    if (!account) {
      throw new NotFoundException('Invalid email');
    }

    const user = await this.userModel.findById(account.userId);
    if (!user) {
      throw new NotFoundException('User not found for the given account');
    }

    const isUserVerified = user.isVerified;
    if (!isUserVerified) {
      throw new BadRequestException('You should verify your email first!');
    }

    if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    // If role is already set to the requested role, return success (idempotent)
    // Compare as strings to handle any type mismatches
    if (String(user.role) === String(role)) {
      // Generate new tokens even if role is already set
      user.lastLogin = new Date();
      await user.save();

      const jti = uuidv4();
      const deviceHash = generateDeviceHash(userAgent);

      const accessToken = signJwtToken({ userId: user._id, role: user.role });
      const refreshToken = signJwtToken(
        { userId: user._id, jti, role: user.role },
        refreshTokenSignOptions,
      );

      await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

      const tokenHash = await hashValue(refreshToken);
      await this.refreshTokenModel.create({
        userId: user._id,
        tokenHash,
        jti,
        deviceHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        userId: user._id,
        userRole: user.role,
        accessToken,
        refreshToken,
      };
    }

    // If role is set to a different role and user is not pending, throw error
    if ((user.role as Roles) !== Roles.PENDING) {
      throw new BadRequestException(
        `Role already set to ${user.role}. Cannot change to ${role}.`,
      );
    }

    // Store onboarding answers for both flows
    user.onboardingAnswers = {
      ...(user.onboardingAnswers || {}),
      flow:
        (role as Roles) === Roles.INSTRUCTORS_USER
          ? 'instructor_email'
          : 'student_email',
      answerOne,
      answerTwo,
      answerThree,
      answerFour,
      answerFive,
      cvUrl,
    };

    // For students: set role immediately.
    // For instructors: keep role as PENDING but mark as pendingInstructor so owner can approve.
    if ((role as Roles) === Roles.STUDENT_USER) {
      user.role = Roles.STUDENT_USER;
      user.pendingInstructor = false;
    } else if ((role as Roles) === Roles.INSTRUCTORS_USER) {
      user.pendingInstructor = true;
    }

    user.lastLogin = new Date();
    await user.save();

    // If instructor: do NOT issue tokens until owner approval
    if ((role as Roles) === Roles.INSTRUCTORS_USER) {
      return {
        userId: user._id,
        userRole: user.role,
        pendingInstructor: true,
        requiresApproval: true,
      };
    }

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const accessToken = signJwtToken({ userId: user._id, role: user.role });
    const refreshToken = signJwtToken(
      { userId: user._id, jti, role: user.role },
      refreshTokenSignOptions,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return {
      userId: user._id,
      userRole: user.role,
      accessToken,
      refreshToken,
    };
  }

  async loginUserEmail(body: {
    email: string;
    password: string;
    userAgent: string;
  }) {
    const { email, password, userAgent } = body;

    const account = await this.accountModel.findOne({
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    if (!account) {
      throw new NotFoundException('User not found for the given account');
    }

    const user = await this.userModel.findById(account.userId);
    if (!user) {
      throw new NotFoundException('User not found for the given account');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isUserVerified = user.isVerified;
    if (!isUserVerified) {
      throw new BadRequestException('You should verify your email first!');
    }

    // Block login until onboarding / approval is complete
    if ((user.role as Roles) === Roles.PENDING) {
      if (user.pendingInstructor) {
        throw new UnauthorizedException(
          'Your instructor application is pending approval. You cannot log in until an owner approves your request.',
        );
      }
      throw new UnauthorizedException(
        'Your account is not fully onboarded. Please complete the welcome step to choose your role.',
      );
    }

    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const accessToken = signJwtToken({ userId: user._id, role: user.role });
    const refreshToken = signJwtToken(
      { userId: user._id, jti, role: user.role },
      refreshTokenSignOptions,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: user.omitPassword(),
      accessToken,
      refreshToken,
    };
  }

  async oAuthGoogleLogin(data: {
    provider: string;
    displayName: string;
    providerId: string;
    picture?: string;
    email?: string;
    userAgent: string;
  }) {
    const { providerId, provider, displayName, email, picture, userAgent } =
      data;

    let user = await this.userModel.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new this.userModel({
        name: displayName,
        email,
        profilePicture: picture || null,
        role: Roles.PENDING,
        isVerified: true,
      });
      await user.save();

      const account = new this.accountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await account.save();

      await this.emailService.sendWelcomeEmail(user.email, user.name);
      isNewUser = true;

      return {
        user: user.omitPassword(),
        isNewUser,
        providerId,
      };
    }

    // Block login until onboarding / approval is complete
    if ((user.role as Roles) === Roles.PENDING) {
      if (user.pendingInstructor) {
        throw new UnauthorizedException(
          'Your instructor application is pending approval. You cannot log in until an owner approves your request.',
        );
      }
      return {
        user: user.omitPassword(),
        isNewUser: true,
        providerId,
      };
    }

    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const accessToken = signJwtToken({ userId: user._id, role: user.role });
    const refreshToken = signJwtToken(
      { userId: user._id, jti, role: user.role },
      refreshTokenSignOptions,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: user.omitPassword(),
      accessToken,
      refreshToken,
      isNewUser: false,
    };
  }

  async welcomeUseroAuthGoogle(body: {
    providerId: string;
    userAgent: string;
    role: string;
    answerOne: string;
    answerTwo?: string;
    answerThree?: string;
    answerFour?: string;
    answerFive?: string;
    cvUrl?: string;
  }) {
    const {
      providerId,
      userAgent,
      role,
      answerOne,
      answerTwo,
      answerThree,
      answerFour,
      answerFive,
      cvUrl,
    } = body;

    const account = await this.accountModel.findOne({
      provider: ProviderEnum.GOOGLE,
      providerId,
    });
    if (!account) {
      throw new NotFoundException('Invalid email');
    }

    const user = await this.userModel.findById(account.userId);
    if (!user) {
      throw new NotFoundException('User not found for the given account');
    }

    if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    // Store onboarding answers
    user.onboardingAnswers = {
      ...(user.onboardingAnswers || {}),
      flow:
        (role as Roles) === Roles.INSTRUCTORS_USER
          ? 'instructor_google'
          : 'student_google',
      answerOne,
      answerTwo,
      answerThree,
      answerFour,
      answerFive,
      cvUrl,
    };

    // For students: set role immediately.
    // For instructors: if still PENDING, mark as pendingInstructor and keep role as PENDING.
    if ((role as Roles) === Roles.STUDENT_USER) {
      user.role = Roles.STUDENT_USER;
      user.pendingInstructor = false;
    } else if ((role as Roles) === Roles.INSTRUCTORS_USER) {
      if (
        (user.role as Roles) !== Roles.PENDING &&
        (user.role as Roles) !== Roles.INSTRUCTORS_USER
      ) {
        throw new BadRequestException('Role already set');
      }
      if ((user.role as Roles) === Roles.PENDING) {
        user.pendingInstructor = true;
      }
    }

    user.lastLogin = new Date();
    await user.save();

    // If instructor: do NOT issue tokens until owner approval
    if (
      (role as Roles) === Roles.INSTRUCTORS_USER &&
      (user.role as Roles) === Roles.PENDING
    ) {
      return {
        userId: user._id,
        userRole: user.role,
        pendingInstructor: true,
        requiresApproval: true,
      };
    }

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const accessToken = signJwtToken({ userId: user._id, role: user.role });
    const refreshToken = signJwtToken(
      { userId: user._id, jti, role: user.role },
      refreshTokenSignOptions,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return {
      userId: user._id,
      userRole: user.role,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refresh_token: string, userAgent: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refresh_token, {
      secret: refreshTokenSignOptions.secret,
    });
    if (!payload) throw new UnauthorizedException('Invalid refresh token');

    const deviceHash = generateDeviceHash(userAgent);

    const storedToken = await this.refreshTokenModel.findOne({
      jti: payload.jti,
    });

    if (!storedToken) {
      await this.revokeAllUserTokens(String(payload.userId));
      throw new UnauthorizedException(
        'Invalid or revoked token due to security reasons',
      );
    }

    if (storedToken.deviceHash !== deviceHash) {
      await this.revokeAllUserTokens(String(payload.userId));
      throw new UnauthorizedException('Device mismatch - possible attack');
    }

    await this.refreshTokenModel.deleteOne({ jti: payload.jti });

    const user = await this.userModel.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const newJti = uuidv4();
    const newAccessToken = signJwtToken({
      userId: payload.userId,
      role: user.role,
    });
    const newRefreshToken = signJwtToken(
      { userId: payload.userId, jti: newJti, role: user.role },
      refreshTokenSignOptions,
    );

    const tokenHash = await hashValue(newRefreshToken);
    await this.refreshTokenModel.create({
      userId: payload.userId,
      tokenHash,
      jti: newJti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private async revokeAllUserTokens(userId: string) {
    await this.refreshTokenModel.deleteMany({ userId });
    this.logger.logSecurity('Potential attack detected - all tokens revoked', {
      userId,
    });
  }

  async requestResetPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.passwordResetModel.deleteMany({ email });

    await this.passwordResetModel.create({
      email,
      resetCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetCode);

    return { message: 'A reset code has been sent successfully' };
  }

  async verifyResetPasswordCode(email: string, code: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Invalid request');

    const resetRecord = await this.passwordResetModel.findOne({
      email,
      resetCode: code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    resetRecord.used = true;
    await resetRecord.save();

    const resetToken = signJwtToken(
      {
        userId: user._id,
        role: '',
      },
      {
        expiresIn: '10m',
        secret: refreshTokenSignOptions.secret,
      },
    );

    return {
      resetToken,
      message: 'Reset code verified successfully',
    };
  }

  async resetPassword(resetToken: string, email: string, newPassword: string) {
    const { payload } = verifyJwtToken<AccessTPayload>(resetToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload)
      throw new UnauthorizedException('Invalid or expired reset token');

    const user = await this.userModel.findById(payload.userId);
    if (!user) throw new NotFoundException('User not found');

    // Verify that the email matches the user from the token
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException('Email does not match the reset token');
    }

    user.password = newPassword;
    await user.save();

    await this.revokeAllUserTokens(String(user._id));

    await this.emailService.sendPasswordResetConfirmationEmail(user.email);

    return { message: 'Password reset successfully' };
  }

  async logout(refreshToken: string, userAgent: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      return { message: 'Logged out successfully' };
    }

    const deviceHash = generateDeviceHash(userAgent);

    await this.refreshTokenModel.deleteOne({
      jti: payload.jti,
      deviceHash,
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) throw new UnauthorizedException('Invalid refresh token');

    await this.revokeAllUserTokens(String(payload.userId));

    return { message: 'Logged out from all devices successfully' };
  }

  async getCurrentUser(accessToken: string) {
    const { payload } = verifyJwtToken<AccessTPayload>(accessToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid access token unauthorized');
    }

    const user = await this.userModel
      .findById(payload.userId)
      .select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
    };
  }

  async validateRoleChange(params: {
    userId: string;
    newRole: string;
    ownerUserId: string;
  }) {
    const { userId, newRole, ownerUserId } = params;

    const ownerUser = await this.userModel.findById(ownerUserId);
    if (!ownerUser) {
      throw new NotFoundException('Owner user not found');
    }

    if ((ownerUser.role as Roles) !== Roles.OWNER) {
      throw new UnauthorizedException('Only owners can change user roles');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!Object.values(Roles).includes(newRole as any)) {
      throw new BadRequestException('Invalid role specified');
    }

    if (userId === ownerUserId) {
      throw new BadRequestException('Owners cannot change their own role');
    }

    if ((newRole as Roles) === Roles.OWNER) {
      throw new BadRequestException(
        'Cannot assign OWNER role through this endpoint',
      );
    }

    if ((targetUser.role as string) === newRole) {
      throw new BadRequestException('User already has the specified role');
    }

    if (
      ![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(newRole as any)
    ) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(newRole as any)) {
      throw new BadRequestException('Invalid role');
    }
    targetUser.role = newRole as (typeof Roles)[keyof typeof Roles];
    await targetUser.save();

    return {
      valid: true,
      message: 'Role change validation successful',
      data: {
        currentRole: targetUser.role,
        newRole: newRole,
        targetUser: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
        ownerUser: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email,
        },
      },
    };
  }

  async verifyAndPermissions(token: string) {
    const { payload, error } = verifyAccessToken(token);

    if (error || !payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userModel.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions =
      (RolePermissions as Record<string, string[]>)[user.role] || [];

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return {
      valid: true,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
      permissions: permissions,
    };
  }

  async getInstructors() {
    const instructors = await this.userModel
      .find({ role: Roles.INSTRUCTORS_USER })
      .select('-password')
      .exec();

    return {
      instructors,
      count: instructors.length,
    };
  }

  async getStudents() {
    const students = await this.userModel
      .find({ role: Roles.STUDENT_USER })
      .select('-password')
      .exec();

    return {
      students,
      count: students.length,
    };
  }

  async getInstructorRequests() {
    const requests = await this.userModel
      .find({ role: Roles.PENDING, pendingInstructor: true })
      .select('-password')
      .exec();

    return {
      requests,
      count: requests.length,
    };
  }

  async approveInstructor(params: { userId: string; ownerUserId: string }) {
    const { userId, ownerUserId } = params;

    const ownerUser = await this.userModel.findById(ownerUserId);
    if (!ownerUser) {
      throw new NotFoundException('Owner user not found');
    }

    if ((ownerUser.role as Roles) !== Roles.OWNER) {
      throw new UnauthorizedException('Only owners can approve instructors');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (
      !targetUser.pendingInstructor ||
      (targetUser.role as Roles) !== Roles.PENDING
    ) {
      throw new BadRequestException('User has no pending instructor request');
    }

    targetUser.role = Roles.INSTRUCTORS_USER;
    targetUser.pendingInstructor = false;
    await targetUser.save();

    return {
      message: 'Instructor approved successfully',
      user: targetUser,
    };
  }

  async rejectInstructor(params: { userId: string; ownerUserId: string }) {
    const { userId, ownerUserId } = params;

    const ownerUser = await this.userModel.findById(ownerUserId);
    if (!ownerUser) {
      throw new NotFoundException('Owner user not found');
    }

    if ((ownerUser.role as Roles) !== Roles.OWNER) {
      throw new UnauthorizedException('Only owners can reject instructors');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (
      !targetUser.pendingInstructor ||
      (targetUser.role as Roles) !== Roles.PENDING
    ) {
      throw new BadRequestException('User has no pending instructor request');
    }

    // Reject = delete the applicant account entirely (and related auth records)
    const email = targetUser.email;
    await this.refreshTokenModel.deleteMany({ userId: targetUser._id });
    await this.accountModel.deleteMany({ userId: targetUser._id });
    await this.emailVerificationModel.deleteMany({ email });
    await this.passwordResetModel.deleteMany({ email });
    await this.userModel.deleteOne({ _id: targetUser._id });

    return {
      message: 'Instructor request rejected successfully',
      userId: targetUser._id,
    };
  }
}
