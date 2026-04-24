import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Admin } from '../admin-auth/schemas/admin.schema';
import {
  AdminSettings,
  AdminSettingsDocument,
} from './schemas/admin-settings.schema';

type SettingsUpdateInput = {
  font?: string;
  fontSize?: string;
  theme?: 'light' | 'dark';
  language?: string;
};

type NotificationsUpdateInput = {
  notifyMe?: 'all' | 'mentions' | 'none';
  communicationEmails?: boolean;
  marketingEmails?: boolean;
  socialEmails?: boolean;
  securityEmails?: boolean;
};

type AccountUpdateInput = {
  name?: string;
  bio?: string;
  address?: string;
  dateOfBirth?: string | null;
  file?: Express.Multer.File;
};

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectModel(AdminSettings.name, 'adminConnection')
    private readonly adminSettingsModel: Model<AdminSettingsDocument>,
    @InjectModel(Admin.name, 'adminConnection')
    private readonly adminModel: Model<Admin>,
  ) {}

  async getSettings(adminId: string) {
    const settings = await this.findOrCreateSettings(adminId);
    return {
      message: 'Admin settings retrieved successfully',
      data: {
        _id: settings._id,
        adminId: settings.adminId,
        font: settings.font,
        fontSize: settings.fontSize,
        theme: settings.theme,
        language: settings.language,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    };
  }

  async updateSettings(adminId: string, update: SettingsUpdateInput) {
    const settings = await this.findOrCreateSettings(adminId);
    Object.assign(settings, update ?? {});
    await settings.save();
    return this.getSettings(adminId);
  }

  async resetSettings(adminId: string) {
    const defaults = this.getDefaultSettings();
    const settings = await this.adminSettingsModel
      .findOneAndUpdate(
        { adminId: new Types.ObjectId(adminId) },
        { $set: defaults },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    return {
      message: 'Admin settings reset successfully',
      data: {
        _id: settings._id,
        adminId: settings.adminId,
        font: settings.font,
        fontSize: settings.fontSize,
        theme: settings.theme,
        language: settings.language,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    };
  }

  async getNotifications(adminId: string) {
    const settings = await this.findOrCreateSettings(adminId);
    return {
      message: 'Admin notification settings retrieved successfully',
      data: {
        _id: settings._id,
        adminId: settings.adminId,
        notifyMe: settings.notifyMe,
        communicationEmails: settings.communicationEmails,
        marketingEmails: settings.marketingEmails,
        socialEmails: settings.socialEmails,
        securityEmails: settings.securityEmails,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    };
  }

  async updateNotifications(adminId: string, update: NotificationsUpdateInput) {
    const settings = await this.findOrCreateSettings(adminId);
    Object.assign(settings, update ?? {});
    await settings.save();
    return this.getNotifications(adminId);
  }

  async resetNotifications(adminId: string) {
    const defaults = this.getDefaultNotifications();
    const settings = await this.adminSettingsModel
      .findOneAndUpdate(
        { adminId: new Types.ObjectId(adminId) },
        { $set: defaults },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    return {
      message: 'Admin notifications reset successfully',
      data: {
        _id: settings._id,
        adminId: settings.adminId,
        notifyMe: settings.notifyMe,
        communicationEmails: settings.communicationEmails,
        marketingEmails: settings.marketingEmails,
        socialEmails: settings.socialEmails,
        securityEmails: settings.securityEmails,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    };
  }

  async getAccount(adminId: string) {
    const admin = await this.adminModel.findById(adminId).lean();
    if (!admin) {
      throw new RpcException({
        statusCode: 404,
        message: `Admin with id '${adminId}' not found.`,
      });
    }

    return {
      message: 'Admin account found successfully',
      data: {
        _id: admin._id,
        adminId: admin._id,
        name: admin.name,
        email: admin.email,
        avatarUrl: admin.profilePictureUrl || '',
        bio: admin.bio || '',
        dateOfBirth: admin.dateOfBirth || null,
        address: admin.address || '',
      },
    };
  }

  async updateAccount(adminId: string, update: AccountUpdateInput) {
    const existingAdmin = await this.adminModel.findById(adminId).exec();
    if (!existingAdmin) {
      throw new RpcException({
        statusCode: 404,
        message: `Admin with id '${adminId}' not found.`,
      });
    }

    let avatarUrl: string | undefined;
    if (update.file) {
      avatarUrl = await this.uploadProfilePicture(adminId, update.file);
    }

    const updatedAdmin = await this.adminModel
      .findOneAndUpdate(
        { _id: adminId },
        {
          $set: {
            ...(update.name !== undefined && { name: update.name }),
            ...(update.bio !== undefined && { bio: update.bio }),
            ...(update.address !== undefined && { address: update.address }),
            ...(update.dateOfBirth !== undefined && {
              dateOfBirth: update.dateOfBirth,
            }),
            ...(avatarUrl && { profilePictureUrl: avatarUrl }),
          },
        },
        { new: true, runValidators: true },
      )
      .lean();

    return {
      message: 'Admin account updated successfully',
      data: {
        _id: updatedAdmin!._id,
        adminId: updatedAdmin!._id,
        name: updatedAdmin!.name,
        email: updatedAdmin!.email,
        avatarUrl: updatedAdmin!.profilePictureUrl || '',
        bio: updatedAdmin!.bio || '',
        dateOfBirth: updatedAdmin!.dateOfBirth || null,
        address: updatedAdmin!.address || '',
      },
    };
  }

  private async findOrCreateSettings(adminId: string) {
    const id = new Types.ObjectId(adminId);
    let settings = await this.adminSettingsModel.findOne({ adminId: id }).exec();
    if (!settings) {
      settings = await this.adminSettingsModel.create({
        adminId: id,
        ...this.getDefaultSettings(),
        ...this.getDefaultNotifications(),
      });
    }
    return settings;
  }

  private getDefaultSettings() {
    return {
      font: 'cairo',
      fontSize: '16',
      theme: 'light',
      language: 'en',
    };
  }

  private getDefaultNotifications() {
    return {
      notifyMe: 'all' as const,
      communicationEmails: false,
      marketingEmails: false,
      socialEmails: false,
      securityEmails: true,
    };
  }

  private async uploadProfilePicture(
    adminId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const region = process.env.AWS_S3_REGION_APP;
    const bucket = process.env.AWS_S3_BUCKET_APP;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new RpcException({
        statusCode: 500,
        message: 'S3 profile upload is not configured',
      });
    }

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `admins/${adminId}/avatars/${Date.now()}.${ext}`;

    const rawBuffer = file.buffer as unknown;
    const fileBody = Buffer.isBuffer(rawBuffer)
      ? rawBuffer
      : typeof rawBuffer === 'string'
        ? Buffer.from(rawBuffer, 'base64')
        : Array.isArray((rawBuffer as { data?: unknown[] })?.data)
          ? Buffer.from((rawBuffer as { data: number[] }).data)
          : Buffer.from([]);

    if (!fileBody.length) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid profile image payload',
      });
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBody,
        ContentType: file.mimetype || 'application/octet-stream',
      }),
    );

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
