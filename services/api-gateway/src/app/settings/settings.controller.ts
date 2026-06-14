/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsGatewayService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Settings Management')
@ApiBearerAuth()
@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsGatewayController {
  constructor(private readonly settingsService: SettingsGatewayService) { }

  @ApiOperation({
    summary: 'Get user settings',
    description:
      'Retrieves settings for a specific user. Users can only access their own settings.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        theme: { type: 'string', example: 'dark' },
        language: { type: 'string', example: 'en' },
        type: { type: 'string', example: 'all' },
        communication_emails: { type: 'boolean', example: true },
        marketing_emails: { type: 'boolean', example: false },
        social_emails: { type: 'boolean', example: true },
        security_emails: { type: 'boolean', example: true },
        mobile: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only access their own settings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Settings not found',
  })
  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only access their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own settings',
      );
    }
    return firstValueFrom(this.settingsService.findOne(userId));
  }

  @ApiOperation({
    summary: 'Update user settings',
    description:
      'Updates settings for a specific user. Users can only update their own settings. All fields are optional.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        theme: { type: 'string', example: 'dark' },
        language: { type: 'string', example: 'en' },
        type: { type: 'string', example: 'all' },
        communication_emails: { type: 'boolean', example: true },
        marketing_emails: { type: 'boolean', example: false },
        social_emails: { type: 'boolean', example: true },
        security_emails: { type: 'boolean', example: true },
        mobile: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only update their own settings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Settings not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @Patch('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Request() req: any,
  ) {
    // Authorization: User can only update their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own settings',
      );
    }
    return firstValueFrom(
      this.settingsService.update(userId, updateSettingDto),
    );
  }

  @ApiOperation({
    summary: 'Delete user settings',
    description:
      'Deletes settings for a specific user. Users can only delete their own settings.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Settings deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only delete their own settings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Settings not found',
  })
  @Delete('user/:userId')
  async remove(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only delete their own settings
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only delete your own settings',
      );
    }
    return firstValueFrom(this.settingsService.remove(userId));
  }
}
