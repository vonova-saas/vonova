import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WaitlistGatewayService } from './waitlist.service';
import { AddWaitUserDto, CheckPromoCodeDto } from './dto/add-wait-user.dto';

@ApiTags('Waitlist Management')
@ApiBearerAuth()
@Controller('api/v1/waitlist')
export class WaitlistGatewayController {
  constructor(private readonly waitlistService: WaitlistGatewayService) { }

  @ApiOperation({
    summary: 'Add user to waitlist',
    description:
      'Adds a new user to the waitlist with their email and full name.',
  })
  @ApiResponse({
    status: 201,
    description: 'User added to waitlist successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'john.doe@example.com' },
        fullName: { type: 'string', example: 'John Doe' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists on waitlist',
  })
  @Post('add-user')
  addWaitUser(@Body() dto: AddWaitUserDto) {
    return this.waitlistService.addWaitUser(dto);
  }

  @ApiOperation({
    summary: 'Check promo code for email',
    description: 'Validates a promo code for a specific email address and returns eligibility information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Promo code validation successful',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        discount: { type: 'number', example: 20 },
        discountType: { type: 'string', example: 'percentage' },
        message: { type: 'string', example: 'Promo code is valid for this email' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid promo code or email',
  })
  @ApiResponse({
    status: 404,
    description: 'Promo code not found or expired',
  })
  @Post('check-promo-code')
  checkPromoCodeForEmail(@Body() dto: CheckPromoCodeDto) {
    return this.waitlistService.checkPromoCodeForEmail(dto);
  }

  @ApiOperation({
    summary: 'Get all waitlist users',
    description: 'Retrieves a list of all users currently on the waitlist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          email: { type: 'string', example: 'john.doe@example.com' },
          fullName: { type: 'string', example: 'John Doe' },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @Get()
  getAllWaitUsers() {
    return this.waitlistService.getAllWaitUsers();
  }

  @ApiOperation({
    summary: 'Get waitlist statistics',
    description: 'Retrieves statistical information about the waitlist including total users and recent additions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 1250 },
        recentAdditions: { type: 'number', example: 45 },
        averageWaitTime: { type: 'number', example: 7 },
        conversionRate: { type: 'number', example: 0.15 },
      },
    },
  })
  @Get('stats')
  getWaitlistStats() {
    return this.waitlistService.getWaitlistStats();
  }

  @ApiOperation({
    summary: 'Get waitlist user by ID',
    description: 'Retrieves a specific waitlist user by their unique identifier.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the waitlist user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist user retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'john.doe@example.com' },
        fullName: { type: 'string', example: 'John Doe' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Waitlist user not found',
  })
  @Get(':userId')
  getWaitUserById(@Param('userId') userId: string) {
    return this.waitlistService.getWaitUserById(userId);
  }

  @ApiOperation({
    summary: 'Delete waitlist user',
    description: 'Removes a user from the waitlist by their unique identifier.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the waitlist user to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist user deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User removed from waitlist successfully' },
        deletedUser: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john.doe@example.com' },
            fullName: { type: 'string', example: 'John Doe' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Waitlist user not found',
  })
  @Delete(':userId')
  deleteWaitUser(@Param('userId') userId: string) {
    return this.waitlistService.deleteWaitUser(userId);
  }
}
