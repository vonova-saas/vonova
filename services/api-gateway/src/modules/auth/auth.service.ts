import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../../utils/appError';
import { generateDeviceHash, hashValue } from '../../utils/bcrypt';
import {
  AccessTPayload,
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyAccessToken,
  verifyJwtToken,
} from '../../utils/jwt';
import { User, UserDocument } from '../../models/auth/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../../models/auth/refreshToken.schema';
import { PasswordReset, PasswordResetDocument } from '../../models/auth/passwordReset.schema';
import { EmailVerification, EmailVerificationDocument } from '../../models/auth/emailVerification.schema';
import { Account, AccountDocument } from '../../models/auth/account.schema';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendWelcomeEmail,
} from '../../services/auth/email.service';
import { ProviderEnum } from '../../enums/account-provider.enum';
import { Roles } from '../../enums/role.enum';
import { RolePermissions } from '../../utils/role-permission';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PasswordReset.name) private passwordResetModel: Model<PasswordResetDocument>,
    @InjectModel(EmailVerification.name) private emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  async registerUser(body: { name: string; email: string; password: string }) {
    const { email, name, password } = body;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) throw new BadRequestException('Email already exist');

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

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.emailVerificationModel.create({
      email,
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationEmail(user.email, verificationCode);

    return { message: 'User registered successfully, you will receive a verification email.' };
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
  }) {
    const { email, userAgent, role, answerOne } = body;

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

    if (user.role !== Roles.PENDING) {
      throw new BadRequestException('Role already set');
    }

    if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }
    user.role = role as typeof Roles[keyof typeof Roles];
    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const [accessToken, refreshToken] = await Promise.all([
      signJwtToken({ userId: user._id, role: user.role }),
      signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
    ]);

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await sendWelcomeEmail(user.email, user.name);

    return {
      userId: user._id,
      userRole: user.role,
      accessToken,
      refreshToken,
    };
  }

  async loginUserEmail(body: { email: string; password: string; userAgent: string }) {
    const { email, password, userAgent } = body;

    const account = await this.accountModel.findOne({
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    if (!account) {
      throw new NotFoundException('User not found for the given account');
    }

    const user = await this.userModel.findById(account.userId).select('+password');
    if (!user) {
      throw new NotFoundException('User not found for the given account');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const isUserVerified = user.isVerified;
    if (!isUserVerified) {
      throw new BadRequestException('You should verify your email first!');
    }

    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const [accessToken, refreshToken] = await Promise.all([
      signJwtToken({ userId: user._id, role: user.role }),
      signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
    ]);

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
    const { providerId, provider, displayName, email, picture, userAgent } = data;

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

      await sendWelcomeEmail(user.email, user.name);
      isNewUser = true;

      return {
        user: user.omitPassword(),
        isNewUser,
        providerId,
      };
    }

    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const [accessToken, refreshToken] = await Promise.all([
      signJwtToken({ userId: user._id, role: user.role }),
      signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
    ]);

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
  }) {
    const { providerId, userAgent, role, answerOne } = body;

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

    if (user.role !== Roles.PENDING) {
      throw new BadRequestException('Role already set');
    }

    if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(role as any)) {
      throw new BadRequestException('Invalid role');
    }
    user.role = role as typeof Roles[keyof typeof Roles];
    user.lastLogin = new Date();
    await user.save();

    const jti = uuidv4();
    const deviceHash = generateDeviceHash(userAgent);

    const [accessToken, refreshToken] = await Promise.all([
      signJwtToken({ userId: user._id, role: user.role }),
      signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
    ]);

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    const tokenHash = await hashValue(refreshToken);
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      jti,
      deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await sendWelcomeEmail(user.email, user.name);

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
      await this.revokeAllUserTokens(payload.userId.toString());
      throw new UnauthorizedException('Invalid or revoked token due to security reasons');
    }

    if (storedToken.deviceHash !== deviceHash) {
      await this.revokeAllUserTokens(payload.userId.toString());
      throw new UnauthorizedException('Device mismatch - possible attack');
    }

    await this.refreshTokenModel.deleteOne({ jti: payload.jti });

    const user = await this.userModel.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const newJti = uuidv4();
    const [newAccessToken, newRefreshToken] = await Promise.all([
      signJwtToken({ userId: payload.userId, role: user.role }),
      signJwtToken(
        { userId: payload.userId, jti: newJti, role: user.role },
        refreshTokenSignOptions,
      ),
    ]);

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
    console.warn(`Potential attack detected for user ${userId}`);
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

    await sendPasswordResetEmail(user.email, resetCode);

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

  async resetPassword(resetToken: string, newPassword: string) {
    const { payload } = verifyJwtToken<AccessTPayload>(resetToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) throw new UnauthorizedException('Invalid or expired reset token');

    const user = await this.userModel.findById(payload.userId);
    if (!user) throw new NotFoundException('User not found');

    user.password = newPassword;
    await user.save();

    await this.revokeAllUserTokens(user._id.toString());

    await sendPasswordResetConfirmationEmail(user.email);

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

    await this.revokeAllUserTokens(payload.userId.toString());

    return { message: 'Logged out from all devices successfully' };
  }

  async getCurrentUser(accessToken: string) {
    const { payload } = verifyJwtToken<AccessTPayload>(accessToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid access token unauthorized');
    }

    const user = await this.userModel.findById(payload.userId).select('-password');

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
    adminUserId: string;
  }) {
    const { userId, newRole, adminUserId } = params;

    const adminUser = await this.userModel.findById(adminUserId);
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (adminUser.role !== Roles.PENDING) {
      throw new UnauthorizedException('Only administrators can change user roles');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!Object.values(Roles).includes(newRole as any)) {
      throw new BadRequestException('Invalid role specified');
    }

    if (userId === adminUserId) {
      throw new BadRequestException('Administrators cannot change their own role');
    }

    if (newRole === Roles.PENDING) {
      throw new BadRequestException('Cannot assign ADMIN role through this endpoint');
    }

    if (targetUser.role === newRole) {
      throw new BadRequestException('User already has the specified role');
    }

    if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(newRole as any)) {
      throw new BadRequestException('Invalid role');
    }

    if (!Object.values(Roles).includes(newRole as any)) {
      throw new BadRequestException('Invalid role');
    }
    targetUser.role = newRole as typeof Roles[keyof typeof Roles];
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
        adminUser: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
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

    const permissions = (RolePermissions as Record<string, string[]>)[user.role] || [];

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

    if (ownerUser.role !== Roles.OWNER) {
      throw new UnauthorizedException('Only owners can approve instructors');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!targetUser.pendingInstructor || targetUser.role !== Roles.PENDING) {
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

    if (ownerUser.role !== Roles.OWNER) {
      throw new UnauthorizedException('Only owners can reject instructors');
    }

    const targetUser = await this.userModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!targetUser.pendingInstructor || targetUser.role !== Roles.PENDING) {
      throw new BadRequestException('User has no pending instructor request');
    }

    // Reject = delete the applicant account entirely (and related auth records)
    const email = targetUser.email;
    await this.refreshTokenModel.deleteMany({ userId: targetUser._id });
    await this.accountModel.deleteMany({ userId: targetUser._id });
    await this.emailVerificationModel.deleteMany({ email });
    await this.passwordResetModel.deleteMany({ email });
    await this.userModel.findByIdAndDelete(targetUser._id);

    return {
      message: 'Instructor request rejected and user deleted successfully',
      userId: userId,
    };
  }
}

