/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import configuration from '../common/config/configuration';
import type { UploadedFile } from '../common/interfaces/file.interface';
import { WaitlistService } from '../waitlist/waitlist.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { WelcomeEmailDto } from './dto/welcome-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CheckCouponDto } from './dto/check-coupon.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { OAuthGoogleLoginDto } from './dto/oauth-google-login.dto';
import { OAuthWelcomeDto } from './dto/oauth-welcome.dto';
import { User, UserDocument } from './schema/user.schema';
import { Account, AccountDocument } from './schema/account.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schema/refreshToken.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schema/emailVerification.schema';
import {
  PasswordReset,
  PasswordResetDocument,
} from './schema/passwordReset.schema';
import { ProviderEnum } from './enums/provider.enum';
import { Role } from './enums/role.enum';
import { UserAccountStatus } from './enums/user-account-status.enum';
import { ApproveInstructorDto } from './dto/approve-instructor.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { NotificationService } from '../notification/notification.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { isPredefinedAdminEmail } from '../common/admin/admin-allowlist';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(PasswordReset.name)
    private readonly passwordResetModel: Model<PasswordResetDocument>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
    private readonly notificationService: NotificationService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  // ========== Helpers ==========

  private requireConfig(value: string | undefined, name: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new Error(`${name} is required in .env`);
    }
    return normalized;
  }

  private signAccessToken(userId: string, role: Role | string) {
    const accessExpiresIn = this.requireConfig(
      configuration().JWT.JWT_ACCESS_EXPIRES_IN,
      'JWT_ACCESS_EXPIRES_IN',
    );
    return this.jwtService.sign(
      { userId, role },
      {
        expiresIn: accessExpiresIn as any,
      },
    );
  }

  private signRefreshToken(userId: string, role: Role | string, jti: string) {
    const refreshSecret = this.requireConfig(
      configuration().JWT.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
    );
    const refreshExpiresIn = this.requireConfig(
      configuration().JWT.JWT_REFRESH_EXPIRES_IN,
      'JWT_REFRESH_EXPIRES_IN',
    );
    return this.jwtService.sign(
      { userId, role, type: 'refresh', jti },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private emailExactCaseInsensitive(email: string): RegExp {
    return new RegExp(`^${this.escapeRegex(this.normalizeEmail(email))}$`, 'i');
  }

  private getRefreshExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  /** Rejects tokens/sessions for users marked ADMIN without an allowlisted email. */
  private enforceAdminEmailAllowlist(
    user: Pick<UserDocument, 'email' | 'role'>,
  ): void {
    if (user.role !== Role.ADMIN) return;
    if (!isPredefinedAdminEmail(user.email)) {
      throw new RpcException({
        statusCode: 403,
        message: 'This account is not authorized as an administrator',
        error: 'Forbidden',
      });
    }
  }

  private assertCanAuthenticate(user: UserDocument) {
    if (user.role === Role.ADMIN) {
      this.enforceAdminEmailAllowlist(user);
      return;
    }
    if (user.onboardingCompleted === false) {
      throw new RpcException({
        statusCode: 403,
        message: 'Complete onboarding first',
        error: 'Forbidden',
      });
    }
    const accountStatus = user.status ?? UserAccountStatus.ACTIVE;
    if (
      user.role === Role.INSTRUCTOR_USER &&
      accountStatus === UserAccountStatus.PENDING
    ) {
      throw new RpcException({
        statusCode: 403,
        message: 'Your account is under review',
        error: 'Forbidden',
      });
    }
    if (
      user.role === Role.INSTRUCTOR_USER &&
      accountStatus === UserAccountStatus.REJECTED
    ) {
      throw new RpcException({
        statusCode: 403,
        message: 'Your instructor application was not approved',
        error: 'Forbidden',
      });
    }
  }

  // ========== Register Flow Services ==========

  async register(dto: RegisterDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    if (isPredefinedAdminEmail(normalizedEmail)) {
      throw new RpcException({
        statusCode: 403,
        message: 'This email is reserved for platform administration',
        error: 'Forbidden',
      });
    }
    const existing = await this.userModel
      .findOne({ email: this.emailExactCaseInsensitive(normalizedEmail) })
      .exec();
    if (existing) {
      throw new RpcException({
        statusCode: 400,
        message: 'Email already exists',
        error: 'Bad Request',
      });
    }

    const user = new this.userModel({
      name: dto.name,
      email: normalizedEmail,
      password: dto.password,
      role: Role.PENDING,
      isVerified: false,
      isActive: true,
      onboardingCompleted: false,
    });
    await user.save();

    const account = new this.accountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: normalizedEmail,
    });
    await account.save();

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.emailVerificationModel.create({
      email: normalizedEmail,
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.notificationService.sendEmailVerification({
      email: normalizedEmail,
      name: dto.name,
      code: verificationCode,
    });

    return {
      message: 'User registered successfully, verification code sent',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const user = await this.userModel
      .findOne({ email: this.emailExactCaseInsensitive(normalizedEmail) })
      .exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const record = await this.emailVerificationModel.findOne({
      email: this.emailExactCaseInsensitive(normalizedEmail),
      verificationCode: dto.code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired verification code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await record.save();

    user.isVerified = true;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async welcomeEmail(dto: WelcomeEmailDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const account = await this.accountModel
      .findOne({
        provider: ProviderEnum.EMAIL,
        providerId: this.emailExactCaseInsensitive(normalizedEmail),
      })
      .exec();
    if (!account) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid email',
        error: 'Not Found',
      });
    }

    const user = await this.userModel.findById(account.userId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    if (!user.isVerified) {
      throw new RpcException({
        statusCode: 400,
        message: 'You should verify your email first',
        error: 'Bad Request',
      });
    }

    if (user.role !== Role.PENDING) {
      throw new RpcException({
        statusCode: 400,
        message: 'Role already set',
        error: 'Bad Request',
      });
    }

    // Validate coupon code if provided (optional: invalid code is skipped, welcome still succeeds)
    if (dto.couponCode?.trim()) {
      try {
        const validationResult = await this.waitlistService.checkCouponCode({
          email: normalizedEmail,
          couponCode: dto.couponCode.trim(),
        });

        if (validationResult.valid) {
          user.couponCode = dto.couponCode.trim();
          user.expireCouponCode = new Date(
            Date.now() + 3 * 30 * 24 * 60 * 60 * 1000,
          ); // 3 months

          await this.waitlistService.markPromoCodeAsUsed(
            normalizedEmail,
            dto.couponCode.trim(),
          );
        }
      } catch {
        // Invalid or expired promo: do not block welcome; continue without applying coupon
      }
    }

    if (String(dto.role).trim().toUpperCase() === Role.ADMIN) {
      throw new RpcException({
        statusCode: 403,
        message: 'Administrator role cannot be assigned through this flow',
        error: 'Forbidden',
      });
    }

    user.role = dto.role as Role;
    user.knowAboutUs = dto.knowAboutUs!;
    user.lastLogin = new Date();
    await user.save();

    const userAgent = dto.userAgent ?? 'unknown';
    const accessToken = this.signAccessToken(String(user._id), user.role);
    const jti = uuidv4();
    const refreshToken = this.signRefreshToken(
      String(user._id),
      user.role,
      jti,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id }).exec();
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: this.hashToken(refreshToken),
      jti,
      deviceHash: userAgent,
      expiresAt: this.getRefreshExpiry(),
    });

    await this.notificationService.sendWelcomeEmail({
      email: normalizedEmail,
      name: user.name,
    });

    return {
      message: 'Role set and user welcomed successfully',
      data: {
        userId: user._id,
        userRole: user.role,
        accessToken,
        refreshToken,
      },
    };
  }

  async uploadProfilePicture(
    dto: UploadProfilePictureDto & { file: UploadedFile },
  ) {
    // Convert base64 back to buffer if needed
    const fileBuffer =
      typeof dto.file.buffer === 'string'
        ? Buffer.from(dto.file.buffer, 'base64')
        : dto.file.buffer;

    if (
      !configuration().AWS_S3_REGION_APP ||
      !configuration().AWS_S3_ACCESS_KEY_ID_APP ||
      !configuration().AWS_S3_SECRET_ACCESS_KEY_APP ||
      !configuration().AWS_S3_BUCKET_APP
    ) {
      throw new RpcException({
        statusCode: 500,
        message: 'AWS S3 is not properly configured',
        error: 'Internal Server Error',
      });
    }

    const user = await this.userModel.findById(dto.userId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const s3 = new S3Client({
      region: configuration().AWS_S3_REGION_APP!,
      credentials: {
        accessKeyId: configuration().AWS_S3_ACCESS_KEY_ID_APP!,
        secretAccessKey: configuration().AWS_S3_SECRET_ACCESS_KEY_APP!,
      },
    });

    const ext = (
      dto.file.originalname?.split('.').pop() || 'jpg'
    ).toLowerCase();
    const key = `avatars/${dto.userId}/${uuidv4()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: configuration().AWS_S3_BUCKET_APP!,
        Key: key,
        Body: fileBuffer,
        ContentType: dto.file.mimetype || 'application/octet-stream',
      }),
    );

    const url = `https://${configuration().AWS_S3_BUCKET_APP}.s3.${configuration().AWS_S3_REGION_APP}.amazonaws.com/${key}`;

    user.profilePictureUrl = url;
    await user.save();

    return {
      message: 'Profile picture uploaded successfully',
      url,
    };
  }

  async checkCouponCode(dto: CheckCouponDto) {
    const existing = await this.userModel
      .findOne({ couponCode: dto.couponCode })
      .lean()
      .exec();
    if (existing) {
      throw new RpcException({
        statusCode: 400,
        message: 'Coupon code already used',
        error: 'Bad Request',
      });
    }

    const user = await this.userModel.findById(dto.userId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    return this.waitlistService.checkCouponCode({
      email: dto.email,
      couponCode: dto.couponCode,
    });
  }

  // ========== OAuth Services ==========

  async oAuthGoogleLogin(dto: OAuthGoogleLoginDto) {
    const { providerId, provider, displayName, email, picture, userAgent } =
      dto;

    if (email && isPredefinedAdminEmail(email)) {
      throw new RpcException({
        statusCode: 403,
        message:
          'This email is reserved for platform administration; use email and password to sign in',
        error: 'Forbidden',
      });
    }

    // First, check if user exists by email
    let user = await this.userModel.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // New user: create with PENDING role, no tokens yet
      user = new this.userModel({
        name: displayName,
        email,
        profilePictureUrl: picture || null,
        role: Role.PENDING,
        isVerified: true, // Google users are always verified
        onboardingCompleted: false,
      });
      await user.save();

      const account = new this.accountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await account.save();

      await this.notificationService.sendWelcomeEmail({
        email: user.email,
        name: user.name,
      });
      isNewUser = true;

      return {
        user: this.omitUserPassword(user),
        isNewUser,
        providerId, // Always return providerId for the welcome step
      };
    }

    if (isPredefinedAdminEmail(user.email)) {
      throw new RpcException({
        statusCode: 403,
        message:
          'Administrator accounts must sign in with email and password',
        error: 'Forbidden',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    this.assertCanAuthenticate(user);

    // Create access Token and refresh Token
    const jti = uuidv4();
    const deviceHash = userAgent; // Simplified device hash

    const accessToken = this.signAccessToken(String(user._id), user.role);
    const refreshToken = this.signRefreshToken(
      String(user._id),
      user.role,
      jti,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: this.hashToken(refreshToken),
      jti,
      deviceHash,
      expiresAt: this.getRefreshExpiry(),
    });

    return {
      user: this.omitUserPassword(user),
      accessToken,
      refreshToken,
      isNewUser: false,
    };
  }

  async welcomeUserOAuthGoogle(dto: OAuthWelcomeDto) {
    const {
      providerId,
      userAgent,
      role,
      username,
      knowAboutUs,
      couponCode,
      profilePictureUrl,
    } = dto;

    const account = await this.accountModel.findOne({
      provider: ProviderEnum.GOOGLE,
      providerId,
    });
    if (!account) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid provider',
        error: 'Not Found',
      });
    }

    const user = await this.userModel.findById(account.userId);
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    // Add User Role & Update last login
    if (user.role !== Role.PENDING) {
      throw new RpcException({
        statusCode: 400,
        message: 'Role already set',
        error: 'Bad Request',
      });
    }

    // Validate role (ADMIN is never self-assigned)
    const validRoles = [Role.STUDENT_USER, Role.INSTRUCTOR_USER];
    if (!validRoles.includes(role as Role)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid role',
        error: 'Bad Request',
      });
    }

    user.role = role as Role;
    user.knowAboutUs = knowAboutUs;
    if (username) user.name = username;
    if (profilePictureUrl) user.profilePictureUrl = profilePictureUrl;

    // Validate coupon code if provided (optional: invalid code is skipped)
    if (couponCode?.trim()) {
      try {
        const validationResult = await this.waitlistService.checkCouponCode({
          email: user.email,
          couponCode: couponCode.trim(),
        });

        if (validationResult.valid) {
          user.couponCode = couponCode.trim();
          user.expireCouponCode = new Date(
            Date.now() + 3 * 30 * 24 * 60 * 60 * 1000,
          ); // 3 months

          await this.waitlistService.markPromoCodeAsUsed(
            user.email,
            couponCode.trim(),
          );
        }
      } catch {
        // Invalid or expired promo: do not block welcome
      }
    }

    await user.save();
    user.lastLogin = new Date();
    await user.save();

    // Create access Token and refresh Token
    const jti = uuidv4();
    const deviceHash = userAgent; // Simplified device hash

    const accessToken = this.signAccessToken(String(user._id), user.role);
    const refreshToken = this.signRefreshToken(
      String(user._id),
      user.role,
      jti,
    );

    await this.refreshTokenModel.deleteMany({ userId: user._id, deviceHash });

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: this.hashToken(refreshToken),
      jti,
      deviceHash,
      expiresAt: this.getRefreshExpiry(),
    });

    await this.notificationService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
    });

    return {
      userId: user._id,
      userRole: user.role,
      username: user.name,
      accessToken,
      refreshToken,
    };
  }

  private omitUserPassword(user: UserDocument) {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  // ========== Login & Tokens ==========

  async login(dto: LoginDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    // Exact match on normalized email (User.email is stored lowercased); regex fallback for legacy rows
    let userWithPassword = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+password')
      .exec();
    if (!userWithPassword) {
      userWithPassword = await this.userModel
        .findOne({ email: this.emailExactCaseInsensitive(normalizedEmail) })
        .select('+password')
        .exec();
    }

    if (!userWithPassword) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    if (!userWithPassword.password) {
      throw new RpcException({
        statusCode: 400,
        message: 'This account does not support password login',
        error: 'Bad Request',
      });
    }

    const isMatch = await (userWithPassword as any).comparePassword(
      dto.password,
    );
    if (!isMatch) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    if (!userWithPassword.isVerified) {
      throw new RpcException({
        statusCode: 400,
        message: 'You should verify your email first',
        error: 'Bad Request',
      });
    }

    this.assertCanAuthenticate(userWithPassword);

    userWithPassword.lastLogin = new Date();
    await userWithPassword.save();

    const accessToken = this.signAccessToken(
      String(userWithPassword._id),
      userWithPassword.role,
    );
    const jti = uuidv4();
    const refreshToken = this.signRefreshToken(
      String(userWithPassword._id),
      userWithPassword.role,
      jti,
    );

    await this.refreshTokenModel
      .deleteMany({ userId: userWithPassword._id })
      .exec();
    await this.refreshTokenModel.create({
      userId: userWithPassword._id,
      tokenHash: this.hashToken(refreshToken),
      jti,
      deviceHash: dto.userAgent,
      expiresAt: this.getRefreshExpiry(),
    });

    // Best-effort account link repair for legacy records.
    const existingEmailAccount = await this.accountModel
      .findOne({
        provider: ProviderEnum.EMAIL,
        userId: userWithPassword._id,
      })
      .exec();
    if (!existingEmailAccount) {
      try {
        await this.accountModel.create({
          provider: ProviderEnum.EMAIL,
          providerId: normalizedEmail,
          userId: userWithPassword._id,
        });
      } catch {
        // Non-blocking: login should succeed even if account link repair fails.
      }
    }

    return {
      message: 'User logged in successfully',
      data: {
        user: {
          _id: userWithPassword._id,
          name: userWithPassword.name,
          email: userWithPassword.email,
          role: userWithPassword.role,
          isActive: userWithPassword.isActive,
          isVerified: userWithPassword.isVerified,
          mustChangePassword: userWithPassword.mustChangePassword === true,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{
        userId: string;
        role: string;
        jti: string;
        type: string;
        exp?: number;
      }>(token, {
        secret: this.requireConfig(
          configuration().JWT.JWT_REFRESH_SECRET,
          'JWT_REFRESH_SECRET',
        ),
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new Error('Malformed refresh token');
      }
      if (await this.tokenBlacklistService.has(token)) {
        throw new Error('Token is blacklisted');
      }

      const tokenHash = this.hashToken(token);
      const storedToken = await this.refreshTokenModel
        .findOne({
          userId: payload.userId,
          tokenHash,
          jti: payload.jti,
          revokedAt: null,
        })
        .exec();
      if (!storedToken) {
        throw new Error('Refresh token not found');
      }

      const user = await this.userModel.findById(payload.userId).exec();
      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'User not found',
          error: 'Unauthorized',
        });
      }

      this.assertCanAuthenticate(user);

      const accessToken = this.signAccessToken(String(user._id), user.role);
      const nextJti = uuidv4();
      const refreshToken = this.signRefreshToken(
        String(user._id),
        user.role,
        nextJti,
      );

      storedToken.revokedAt = new Date();
      storedToken.revokedReason = 'rotated';
      await storedToken.save();

      if (payload.exp) {
        await this.tokenBlacklistService.add(token, payload.exp);
      }
      await this.refreshTokenModel.create({
        userId: user._id,
        tokenHash: this.hashToken(refreshToken),
        rotatedFromTokenHash: tokenHash,
        jti: nextJti,
        deviceHash: storedToken.deviceHash,
        expiresAt: this.getRefreshExpiry(),
      });

      return {
        message: 'Refreshed token successfully',
        accessToken,
        refreshToken,
      };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      });
    }
  }

  async logout(token: string) {
    const decoded = this.jwtService.decode<{ exp?: number }>(token);
    const tokenHash = this.hashToken(token);
    await this.refreshTokenModel
      .updateOne(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date(), revokedReason: 'logout' },
      )
      .exec();
    if (decoded?.exp) {
      await this.tokenBlacklistService.add(token, decoded.exp);
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAll(payload: { accessToken: string }) {
    try {
      const decoded = this.jwtService.verify<{ userId: string }>(
        payload.accessToken,
      );
      await this.refreshTokenModel
        .deleteMany({ userId: decoded.userId })
        .exec();
      return { message: 'Logged out from all devices successfully' };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'Unauthorized',
      });
    }
  }

  async approveInstructor(dto: ApproveInstructorDto) {
    const user = await this.userModel.findById(dto.instructorId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }
    if (user.role !== Role.INSTRUCTOR_USER) {
      throw new RpcException({
        statusCode: 400,
        message: 'User is not an instructor',
        error: 'Bad Request',
      });
    }
    if (user.status !== UserAccountStatus.PENDING) {
      throw new RpcException({
        statusCode: 400,
        message: 'Instructor is not pending approval',
        error: 'Bad Request',
      });
    }
    user.status = UserAccountStatus.ACTIVE;
    await user.save();
    return {
      message: 'Instructor approved successfully',
      data: {
        userId: user._id,
        status: user.status,
      },
    };
  }

  async rejectInstructor(dto: ApproveInstructorDto) {
    const user = await this.userModel.findById(dto.instructorId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }
    if (user.role !== Role.INSTRUCTOR_USER) {
      throw new RpcException({
        statusCode: 400,
        message: 'User is not an instructor',
        error: 'Bad Request',
      });
    }
    if (user.status !== UserAccountStatus.PENDING) {
      throw new RpcException({
        statusCode: 400,
        message: 'Instructor is not pending approval',
        error: 'Bad Request',
      });
    }
    user.status = UserAccountStatus.REJECTED;
    await user.save();
    return {
      message: 'Instructor application rejected',
      data: {
        userId: user._id,
        status: user.status,
      },
    };
  }

  async listPendingInstructors() {
    const rows = await this.userModel
      .find({
        role: Role.INSTRUCTOR_USER,
        status: UserAccountStatus.PENDING,
        onboardingCompleted: true,
      })
      .select('-password -couponCode')
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const instructors = rows.map((u) => ({
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        profilePictureUrl: u.profilePictureUrl,
        role: u.role,
        status: u.status,
        onboardingCompleted: u.onboardingCompleted,
        isVerified: u.isVerified,
        isActive: u.isActive,
        bio: u.bio,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
      onboarding: u.onboarding ?? {},
      cvUrl: u.cvUrl ?? null,
    }));

    return {
      message: 'Pending instructors retrieved',
      data: { instructors },
    };
  }

  async getCurrentUser(accessToken: string) {
    try {
      const payload = this.jwtService.verify<{ userId: string; role: string }>(
        accessToken,
      );
      const user = await this.userModel
        .findById(payload.userId)
        .select('-password -couponCode -expireCouponCode -knowAboutUs')
        .exec();
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }
      this.enforceAdminEmailAllowlist(user);
      return {
        message: 'Current user fetched successfully',
        user,
      };
    } catch (e) {
      if (e instanceof RpcException) {
        throw e;
      }
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'Unauthorized',
      });
    }
  }

  async adminResetPassword(accessToken: string, dto: AdminResetPasswordDto) {
    let payload: { userId: string; role: string };
    try {
      payload = this.jwtService.verify<{ userId: string; role: string }>(
        accessToken,
      );
    } catch {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'Unauthorized',
      });
    }

    const user = await this.userModel
      .findById(payload.userId)
      .select('+password')
      .exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }
    if (user.role !== Role.ADMIN) {
      throw new RpcException({
        statusCode: 403,
        message: 'Only administrators may use this endpoint',
        error: 'Forbidden',
      });
    }
    this.enforceAdminEmailAllowlist(user);

    const isMatch = await (user as any).comparePassword(dto.oldPassword);
    if (!isMatch) {
      throw new RpcException({
        statusCode: 400,
        message: 'Current password is incorrect',
        error: 'Bad Request',
      });
    }
    if (dto.oldPassword === dto.newPassword) {
      throw new RpcException({
        statusCode: 400,
        message: 'New password must differ from the current password',
        error: 'Bad Request',
      });
    }

    user.password = dto.newPassword;
    user.mustChangePassword = false;
    await user.save();

    await this.refreshTokenModel.deleteMany({ userId: user._id }).exec();

    return { message: 'Password updated successfully; sign in again with your new password' };
  }

  // ========== Password Reset ==========

  async requestResetPassword(dto: RequestResetPasswordDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const user = await this.userModel
      .findOne({ email: this.emailExactCaseInsensitive(normalizedEmail) })
      .exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.passwordResetModel
      .deleteMany({ email: this.emailExactCaseInsensitive(normalizedEmail) })
      .exec();
    await this.passwordResetModel.create({
      email: normalizedEmail,
      resetCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.notificationService.sendPasswordResetCode({
      email: normalizedEmail,
      code: resetCode,
    });

    return { message: 'A reset code has been sent successfully' };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const record = await this.passwordResetModel.findOne({
      email: dto.email,
      resetCode: dto.code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired reset code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await record.save();

    const resetToken = this.jwtService.sign(
      { email: dto.email, type: 'password-reset' },
      { expiresIn: '10m' },
    );

    return {
      message: 'Reset code verified successfully',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify<{ email: string; type: string }>(
        dto.resetToken,
      );
      if (payload.type !== 'password-reset') {
        throw new Error('Invalid reset token type');
      }

      const user = await this.userModel
        .findOne({ email: payload.email })
        .exec();
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }

      user.password = dto.newPassword;
      await user.save(); // triggers pre-save hook to hash password

      await this.refreshTokenModel.deleteMany({ userId: user._id }).exec();

      return { message: 'Password reset successfully' };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid or expired reset token',
        error: 'Unauthorized',
      });
    }
  }
}
