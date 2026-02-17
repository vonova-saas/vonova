import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSettings } from './schema/settings.schema';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings.name)
    private readonly settingsModel: Model<UserSettings>,
  ) {}

  async create(createSettingDto: CreateSettingDto) {
    try {
      const defaultSettings = this.getDefaultSettings();
      const settings = new this.settingsModel({
        ...defaultSettings,
        ...createSettingDto,
      });
      return {
        message: 'Settings created successfully',
        data: await settings.save(),
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: error.message || 'Failed to create tutorial',
      });
    }
  }

  async findOne(userId: string) {
    const settings = await this.settingsModel.findOne({ userId }).exec();
    if (!settings) {
      return this.create({ ...new CreateSettingDto(), userId });
    }
    return {
      message: 'Settings found successfully',
      data: settings,
    };
  }

  async update(userId: string, updateSettingDto: UpdateSettingDto) {
    const existingSettings = await this.settingsModel
      .findOneAndUpdate({ userId }, updateSettingDto, { new: true })
      .exec();

    if (!existingSettings) {
      return this.create({
        ...new CreateSettingDto(),
        userId,
        ...updateSettingDto,
      });
    }
    return {
      message: 'Settings updated successfully',
      data: existingSettings,
    };
  }

  async remove(userId: string) {
    const result = await this.settingsModel.deleteOne({ userId }).exec();
    if (result.deletedCount === 0) {
      throw new RpcException({
        statusCode: 404,
        message: `Settings for user ${userId} not found`,
      });
    }
    return {
      message: 'Settings deleted successfully',
    };
  }

  private getDefaultSettings() {
    return {
      theme: 'system',
      language: 'en',
      type: 'all',
      communication_emails: false,
      marketing_emails: false,
      social_emails: false,
      security_emails: true,
      mobile: false,
    };
  }
}
