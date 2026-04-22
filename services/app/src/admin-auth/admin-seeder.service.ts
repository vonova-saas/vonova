import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';
import {
  getPredefinedAdminEmails,
  normalizeAdminEmail,
} from '../common/admin/admin-allowlist';

const DEFAULT_SEEDED_ADMIN_TEMP_PASSWORD = 'Temp@12345';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(Admin.name, 'adminConnection')
    private readonly adminModel: Model<AdminDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean>('SEED_ADMINS_ON_BOOT');
    if (enabled) {
      await this.seed();
    } else {
      this.logger.log(
        'Admin seed skipped (SEED_ADMINS_ON_BOOT is not true). Set SEED_ADMINS_ON_BOOT=true in .env to enable auto-seeding.',
      );
    }
  }

  /**
   * Idempotent: creates missing allowlisted admin users in the admin database
   * with a bcrypt-hashed temp password. Skips emails that already exist.
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

    this.logger.log(
      `Starting admin seed for ${allowlisted.length} email(s) in admin database...`,
    );

    for (const emailRaw of allowlisted) {
      const email = normalizeAdminEmail(emailRaw);

      const existing = await this.adminModel
        .findOne({ email: this.emailRegexExact(email) })
        .exec();

      if (existing) {
        this.logger.log(`Admin already exists in admin database: ${email}`);
        continue;
      }

      // Create new admin in admin database
      const admin = new this.adminModel({
        email,
        password: tempPassword, // Will be hashed by pre-save hook
        isTempPassword: true,
        role: 'admin',
      });

      await admin.save();

      this.logger.log(
        `✓ Seeded admin in admin database: ${email} (temp password must be changed on first login)`,
      );
    }

    this.logger.log('Admin seeding completed successfully.');
  }

  private emailRegexExact(email: string): RegExp {
    return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }
}
