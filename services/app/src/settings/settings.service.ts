import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSettings } from '../schemas/UserSettings.schema';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings.name)
    private readonly settingsModel: Model<UserSettings>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<UserSettings> {
    const defaultSettings = this.getDefaultSettings();
    const settings = new this.settingsModel({
      ...defaultSettings,
      ...createSettingDto,
    });
    return settings.save();
  }

  async findAll(): Promise<UserSettings[]> {
    return this.settingsModel.find().exec();
  }

  async findOne(userId: string): Promise<UserSettings> {
    const settings = await this.settingsModel.findOne({ userId }).exec();
    if (!settings) {
      return this.create({ userId });
    }
    return settings;
  }

  async update(
    userId: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<UserSettings> {
    const existingSettings = await this.settingsModel
      .findOneAndUpdate({ userId }, updateSettingDto, { new: true })
      .exec();

    if (!existingSettings) {
      return this.create({ userId, ...updateSettingDto });
    }
    return existingSettings;
  }

  async remove(userId: string): Promise<void> {
    const result = await this.settingsModel.deleteOne({ userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Settings for user ${userId} not found`);
    }
  }

  private getDefaultSettings() {
    return {
      font: 'Inter',
      fontSize: '16',
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
    };
  }
}
