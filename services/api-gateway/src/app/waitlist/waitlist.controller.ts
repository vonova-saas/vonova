import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WaitlistGatewayService } from './waitlist.service';
import { AddWaitUserDto, CheckPromoCodeDto } from './dto/add-wait-user.dto';

@ApiTags('Waitlist Management')
@ApiBearerAuth()
@Controller('api/v1/waitlist')
export class WaitlistGatewayController {
  constructor(private readonly waitlistService: WaitlistGatewayService) {}

  @ApiOperation({
    summary: 'Add user to waitlist',
    description:
      'Adds a new user to the waitlist with their email and full name.',
  })
  @ApiResponse({
    status: 201,
    description: 'User added to waitlist successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user data',
  })
  @Post('user/:userId')
  addWaitUser(@Param('userId') _userId: string, @Body() dto: AddWaitUserDto) {
    return this.waitlistService.addWaitUser(dto);
  }

  @ApiOperation({
    summary: 'Check promo code for email',
    description:
      'Validates a promo code for a specific email address and returns eligibility information.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Promo code validation successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid promo code or email',
  })
  @Post('user/:userId/check-promo-code')
  checkPromoCodeForEmail(@Body() dto: CheckPromoCodeDto) {
    return this.waitlistService.checkPromoCodeForEmail(dto);
  }

  @ApiOperation({
    summary: 'Get all waitlist users',
    description: 'Retrieves a list of all users currently on the waitlist.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist users retrieved successfully',
  })
  @Get('user/:userId')
  getAllWaitUsers() {
    return this.waitlistService.getAllWaitUsers();
  }

  @ApiOperation({
    summary: 'Get waitlist statistics',
    description:
      'Retrieves statistical information about the waitlist including total users and recent additions.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist statistics retrieved successfully',
  })
  @Get('user/:userId/stats')
  getWaitlistStats() {
    return this.waitlistService.getWaitlistStats();
  }

  @ApiOperation({
    summary: 'Get waitlist user by ID',
    description:
      'Retrieves a specific waitlist user by their unique identifier.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the waitlist user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist user retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Waitlist user not found',
  })
  @Get('user/:userId/:id')
  getWaitUserById(@Param('userId') _userId: string, @Param('id') id: string) {
    return this.waitlistService.getWaitUserById(id);
  }

  @ApiOperation({
    summary: 'Delete waitlist user',
    description: 'Removes a user from the waitlist by their unique identifier.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the waitlist user to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist user deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Waitlist user not found',
  })
  @Delete('user/:userId/:id')
  deleteWaitUser(@Param('userId') _userId: string, @Param('id') id: string) {
    return this.waitlistService.deleteWaitUser(id);
  }
}
