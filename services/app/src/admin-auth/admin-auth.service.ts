import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import configuration from '../common/config/configuration';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { AdminOtp, AdminOtpDocument } from './schemas/admin-otp.schema';
import {
  AdminRefreshToken,
  AdminRefreshTokenDocument,
} from './schemas/admin-refresh-token.schema';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailSenderService } from '../notification/email-sender.service';
import {
  isPredefinedAdminEmail,
  normalizeAdminEmail,
} from '../common/admin/admin-allowlist';

const OTP_EXPIRATION_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 30;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  // In-memory rate limiting (consider Redis for production with multiple instances)
  private readonly otpRequestTracker = new Map<
    string,
    { count: number; lastRequest: Date; windowStart: Date }
  >();

  constructor(
    @InjectModel(Admin.name, 'adminConnection')
    private readonly adminModel: Model<AdminDocument>,
    @InjectModel(AdminOtp.name, 'adminConnection')
    private readonly adminOtpModel: Model<AdminOtpDocument>,
    @InjectModel(AdminRefreshToken.name, 'adminConnection')
    private readonly adminRefreshTokenModel: Model<AdminRefreshTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly emailSender: EmailSenderService,
  ) { }

  /**
   * Step 1: Request login code
   * Validates admin credentials and sends OTP via email
   */
  async requestLoginCode(dto: RequestLoginCodeDto): Promise<{ message: string }> {
    const startTime = Date.now();
    const normalizedEmail = normalizeAdminEmail(dto.email);

    // Validate email is in admin allowlist
    if (!isPredefinedAdminEmail(normalizedEmail)) {
      this.logger.warn(
        `Unauthorized admin login attempt for email: ${normalizedEmail}`,
      );
      throw new ForbiddenException(
        'Access denied. This email is not authorized as an admin.',
      );
    }

    // Rate limiting check
    this.enforceRateLimit(normalizedEmail);

    // Fetch admin from Admin collection (admin DB)
    const admin = await this.adminModel
      .findOne({ email: normalizedEmail })
      .select('+password')
      .exec();

    if (!admin) {
      this.logger.warn(`Admin not found: ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for admin: ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate 6-digit OTP
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Store OTP in AdminOtp collection with upsert (invalidates previous OTPs)
    await this.adminOtpModel
      .findOneAndUpdate(
        { email: normalizedEmail },
        {
          email: normalizedEmail,
          code,
          expiresAt,
          used: false,
          failedAttempts: 0,
        },
        { upsert: true, new: true },
      )
      .exec();

    // Send OTP email (fire-and-forget for performance)
    this.sendOtpEmailAsync(normalizedEmail, code).catch((err) => {
      this.logger.error(
        `Failed to send OTP email to ${normalizedEmail}: ${(err as Error).message}`,
      );
    });

    const duration = Date.now() - startTime;
    this.logger.log(
      `OTP generated for ${normalizedEmail} in ${duration}ms`,
    );

    return { message: 'OTP sent to vonovacompany@gmail.com' };
  }

  /**
   * Step 2: Verify login code
   * Validates OTP and returns JWT access token
   */
  async verifyLogin(dto: VerifyLoginDto): Promise<{ access_token: string; refresh_token: string }> {
    const normalizedEmail = normalizeAdminEmail(dto.email);

    // Fetch OTP record
    const otpRecord = await this.adminOtpModel
      .findOne({ email: normalizedEmail })
      .exec();

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if OTP is already used
    if (otpRecord.used) {
      throw new UnauthorizedException('OTP has already been used');
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Check failed attempts
    if (otpRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Verify OTP code
    if (otpRecord.code !== dto.code) {
      // Increment failed attempts
      await this.adminOtpModel
        .findByIdAndUpdate(otpRecord._id, {
          $inc: { failedAttempts: 1 },
        })
        .exec();

      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark OTP as used
    await this.adminOtpModel
      .findByIdAndUpdate(otpRecord._id, { used: true })
      .exec();

    // Fetch admin from Admin collection
    const admin = await this.adminModel
      .findOne({ email: normalizedEmail })
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // Generate JWT token
    const payload = {
      sub: admin._id.toString(),
      role: 'admin',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshJti = crypto.randomUUID();
    const refreshToken = this.signRefreshToken(
      admin._id.toString(),
      refreshJti,
    );

    await this.adminRefreshTokenModel.deleteMany({ adminId: admin._id }).exec();
    await this.adminRefreshTokenModel.create({
      adminId: admin._id,
      tokenHash: this.hashToken(refreshToken),
      jti: refreshJti,
      deviceHash: 'admin-portal',
      expiresAt: this.getRefreshExpiry(),
    });

    this.logger.log(`Admin logged in successfully: ${normalizedEmail}`);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Step 3: Reset password
   * Allows admin to change password (required for temp passwords)
   */
  async resetPassword(
    adminId: string,
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Fetch admin from Admin collection
    const admin = await this.adminModel
      .findById(adminId)
      .select('+password')
      .exec();

    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      admin.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Ensure new password is different from old password
    const isSamePassword = await bcrypt.compare(dto.newPassword, admin.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the old password',
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    // Update password and clear temp password flag
    admin.password = hashedPassword;
    admin.isTempPassword = false;
    await admin.save();

    this.logger.log(`Password reset successfully for admin: ${admin.email}`);

    return { message: 'Password updated successfully' };
  }

  async refreshToken(
    token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify<{
        adminId: string;
        role: string;
        jti: string;
        type: string;
      }>(token, {
        secret: this.requireConfig(
          configuration().JWT.JWT_REFRESH_SECRET,
          'JWT_REFRESH_SECRET',
        ),
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Malformed refresh token');
      }

      const storedToken = await this.adminRefreshTokenModel
        .findOne({
          adminId: payload.adminId,
          tokenHash: this.hashToken(token),
          jti: payload.jti,
          revokedAt: null,
        })
        .exec();
      if (!storedToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const admin = await this.adminModel.findById(payload.adminId).exec();
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      const accessToken = this.jwtService.sign({
        sub: admin._id.toString(),
        role: 'admin',
      });

      const nextJti = crypto.randomUUID();
      const refreshToken = this.signRefreshToken(admin._id.toString(), nextJti);

      storedToken.revokedAt = new Date();
      storedToken.revokedReason = 'rotated';
      await storedToken.save();

      await this.adminRefreshTokenModel.create({
        adminId: admin._id,
        tokenHash: this.hashToken(refreshToken),
        rotatedFromTokenHash: this.hashToken(token),
        jti: nextJti,
        deviceHash: storedToken.deviceHash,
        expiresAt: this.getRefreshExpiry(),
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    await this.adminRefreshTokenModel
      .updateOne(
        { tokenHash: this.hashToken(token), revokedAt: null },
        { revokedAt: new Date(), revokedReason: 'logout' },
      )
      .exec();

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(
    accessToken: string,
  ): Promise<{ message: string; user: { _id: string; name: string; email: string; role: string } }> {
    try {
      const payload = this.jwtService.verify<{ sub: string; role: string }>(
        accessToken,
      );
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Invalid admin token');
      }

      const admin = await this.adminModel.findById(payload.sub).exec();
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      return {
        message: 'Current admin fetched successfully',
        user: {
          _id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Generate a 6-digit OTP using crypto.randomInt
   */
  private generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999);
    return otp.toString();
  }

  private requireConfig(value: string | undefined, name: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new Error(`${name} is required in .env`);
    }
    return normalized;
  }

  private signRefreshToken(adminId: string, jti: string): string {
    const refreshSecret = this.requireConfig(
      configuration().JWT.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
    );
    const refreshExpiresIn = this.requireConfig(
      configuration().JWT.JWT_REFRESH_EXPIRES_IN,
      'JWT_REFRESH_EXPIRES_IN',
    );
    return this.jwtService.sign(
      { adminId, role: 'admin', type: 'refresh', jti },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as any },
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Send OTP email asynchronously (non-blocking)
   */
  private async sendOtpEmailAsync(
    adminEmail: string,
    code: string,
  ): Promise<void> {
    const subject = 'Admin Login OTP - Vonova';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Admin Login Request</h2>
        <p>Hello Admin,</p>
        <p>A login request was made for: <strong>${adminEmail}</strong></p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in <strong>${OTP_EXPIRATION_MINUTES} minutes</strong>.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you did not request this login, please ignore this email and secure your admin credentials.
        </p>
      </div>
    `;

    await this.emailSender.sendEmail({
      to: 'vonovacompany@gmail.com',
      subject,
      html,
    });
  }

  /**
   * Enforce rate limiting for OTP requests
   */
  private enforceRateLimit(email: string): void {
    const now = new Date();
    const tracker = this.otpRequestTracker.get(email);

    if (!tracker) {
      // First request
      this.otpRequestTracker.set(email, {
        count: 1,
        lastRequest: now,
        windowStart: now,
      });
      return;
    }

    // Check cooldown period (30 seconds between requests)
    const timeSinceLastRequest =
      (now.getTime() - tracker.lastRequest.getTime()) / 1000;
    if (timeSinceLastRequest < OTP_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(OTP_COOLDOWN_SECONDS - timeSinceLastRequest);
      throw new BadRequestException(
        `Please wait ${waitTime} seconds before requesting another OTP`,
      );
    }

    // Check rate limit window (5 minutes)
    const windowElapsed =
      (now.getTime() - tracker.windowStart.getTime()) / 1000 / 60;

    if (windowElapsed >= RATE_LIMIT_WINDOW_MINUTES) {
      // Reset window
      this.otpRequestTracker.set(email, {
        count: 1,
        lastRequest: now,
        windowStart: now,
      });
      return;
    }

    // Check if limit exceeded
    if (tracker.count >= MAX_OTP_REQUESTS_PER_WINDOW) {
      const remainingTime = Math.ceil(
        RATE_LIMIT_WINDOW_MINUTES - windowElapsed,
      );
      throw new BadRequestException(
        `Too many OTP requests. Please try again in ${remainingTime} minute(s)`,
      );
    }

    // Increment count
    tracker.count++;
    tracker.lastRequest = now;
    this.otpRequestTracker.set(email, tracker);
  }
}
