import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schema/user.schema';
import { Account, AccountDocument } from '../auth/schema/account.schema';
import { Role } from '../auth/enums/role.enum';
import { ProviderEnum } from '../auth/enums/provider.enum';
import { UserAccountStatus } from '../auth/enums/user-account-status.enum';
import {
  getPredefinedAdminEmails,
  normalizeAdminEmail,
} from '../common/admin/admin-allowlist';

const DEFAULT_SEEDED_ADMIN_TEMP_PASSWORD = 'Temp@12345';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean>('SEED_ADMINS_ON_BOOT');
    if (enabled) {
      await this.seed();
    } else {
      this.logger.log(
        'Admin seed skipped (SEED_ADMINS_ON_BOOT is not true). Run once: pnpm seed:admins',
      );
    }
  }

  /**
   * Idempotent: creates missing allowlisted admin users with a bcrypt-hashed temp password.
   * Skips emails that already exist with a non-ADMIN role (logs warning).
   */
  async seed(): Promise<void> {
    const allowlisted = getPredefinedAdminEmails();
    const tempPassword =
      process.env.SEEDED_ADMIN_TEMP_PASSWORD?.trim() ||
      DEFAULT_SEEDED_ADMIN_TEMP_PASSWORD;

    if (allowlisted.length === 0) {
      this.logger.warn(
        'No admin emails configured (set ADMIN_EMAIL_1, ADMIN_EMAIL_2, ADMIN_EMAIL_3 in .env). Nothing to seed.',
      );
      return;
    }
    for (const emailRaw of allowlisted) {
      const email = normalizeAdminEmail(emailRaw);
      const localPart = email.split('@')[0] ?? 'Admin';
      const displayName =
        localPart.charAt(0).toUpperCase() +
        localPart.slice(1).replace(/[._-]/g, ' ');

      const existing = await this.userModel
        .findOne({ email: this.emailRegexExact(email) })
        .exec();

      if (existing) {
        if (existing.role !== Role.ADMIN) {
          this.logger.warn(
            `Admin seed skipped for ${email}: user exists with role ${String(existing.role)}`,
          );
          continue;
        }
        this.logger.log(`Admin already present: ${email}`);
        continue;
      }

      const user = new this.userModel({
        name: displayName,
        email,
        password: tempPassword,
        role: Role.ADMIN,
        isVerified: true,
        isActive: true,
        onboardingCompleted: true,
        status: UserAccountStatus.ACTIVE,
        mustChangePassword: true,
        profilePictureUrl: null,
        knowAboutUs: null,
      });
      await user.save();

      try {
        await this.accountModel.create({
          provider: ProviderEnum.EMAIL,
          providerId: email,
          userId: user._id,
        });
      } catch (e) {
        this.logger.warn(
          `Could not create EMAIL account link for ${email}: ${(e as Error).message}`,
        );
      }

      this.logger.log(`Seeded admin user: ${email}`);
    }
  }

  private emailRegexExact(email: string): RegExp {
    return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }
}
