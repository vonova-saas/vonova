import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UserSettings } from '../schemas/UserSettings.schema';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create user settings' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserSettings })
  create(@Body() createSettingDto: CreateSettingDto): Promise<UserSettings> {
    return this.settingsService.create(createSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiResponse({ status: HttpStatus.OK, type: [UserSettings] })
  findAll(): Promise<UserSettings[]> {
    return this.settingsService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get settings for a specific user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserSettings })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Settings not found' })
  findOne(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserSettings> {
    return this.settingsService.findOne(userId);
  }

  @Patch('user/:userId')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: HttpStatus.OK, type: UserSettings })
  update(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<UserSettings> {
    return this.settingsService.update(userId, updateSettingDto);
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: 'Delete user settings' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Settings not found' })
  async remove(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    await this.settingsService.remove(userId);
  }
}
