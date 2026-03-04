/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Body,
  Put,
  Param,
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
import { BillingGatewayService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Billing Management')
@ApiBearerAuth()
@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard)
export class BillingGatewayController {
  constructor(private readonly billingService: BillingGatewayService) { }

  @ApiOperation({
    summary: 'Get user billing information',
    description:
      'Retrieves billing information for a specific user. Users can only access their own billing data.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        plan: { type: 'string', example: 'PREMIUM' },
        cardNumber: { type: 'string', example: '****-****-****-1234' },
        nameOfCard: { type: 'string', example: 'John Doe' },
        expiryDate: { type: 'string', example: '12/25' },
        billingEmail: { type: 'string', example: 'billing@example.com' },
        cardAddress: { type: 'string', example: '123 Main St, Apt 4B' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'United States' },
        zipCode: { type: 'string', example: '10001' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied - User can only access their own billing information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Billing information not found',
  })
  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    // Authorization: User can only access their own billing
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own billing information',
      );
    }
    return firstValueFrom(this.billingService.findOne(userId));
  }

  @ApiOperation({
    summary: 'Update user billing information',
    description:
      'Updates billing information for a specific user. Users can only update their own billing data. All fields are optional.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing information updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        plan: { type: 'string', example: 'PREMIUM' },
        cardNumber: { type: 'string', example: '****-****-****-1234' },
        nameOfCard: { type: 'string', example: 'John Doe' },
        expiryDate: { type: 'string', example: '12/25' },
        billingEmail: { type: 'string', example: 'billing@example.com' },
        cardAddress: { type: 'string', example: '123 Main St, Apt 4B' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'United States' },
        zipCode: { type: 'string', example: '10001' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied - User can only update their own billing information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Billing information not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @Put('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateBillingDto: UpdateBillingDto,
    @Request() req: any,
  ) {
    // Authorization: User can only update their own billing
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own billing information',
      );
    }
    return firstValueFrom(this.billingService.update(userId, updateBillingDto));
  }
}
