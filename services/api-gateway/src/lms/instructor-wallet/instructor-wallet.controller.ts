import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

/**
 * Instructor Wallet Controller (API Gateway)
 * 
 * REST endpoints for instructor earnings dashboard:
 * - GET /instructor/wallet - Wallet balance & summary
 * - GET /instructor/earnings - Earnings analytics
 * - GET /instructor/transactions - Transaction history
 * - GET /instructor/analytics - Performance metrics
 */
@Controller('instructor')
@UseGuards(JwtAuthGuard)
export class InstructorWalletGatewayController {
  constructor(
    @Inject('NATS_SERVICE') private readonly client: ClientProxy,
  ) { }

  /**
   * Get instructor wallet with real-time balances
   */
  @Get('wallet')
  async getWallet(@Req() req: Request) {
    const userId = (req as any).user.userId;

    return this.client
      .send(
        { cmd: 'instructor.wallet.get' },
        { instructorId: userId },
      )
      .toPromise();
  }

  /**
   * Get earnings breakdown (daily, weekly, monthly, by course)
   */
  @Get('earnings')
  async getEarnings(
    @Req() req: Request,
    @Query('days') days: string = '30',
  ) {
    const userId = (req as any).user.userId;

    return this.client
      .send(
        { cmd: 'instructor.earnings.get' },
        { instructorId: userId, days: parseInt(days) },
      )
      .toPromise();
  }

  /**
   * Get transaction history with filtering
   */
  @Get('transactions')
  async getTransactions(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const userId = (req as any).user.userId;

    return this.client
      .send(
        { cmd: 'instructor.transactions.get' },
        {
          instructorId: userId,
          filters: {
            type,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
        },
      )
      .toPromise();
  }

  /**
   * Get comprehensive analytics dashboard
   */
  @Get('analytics')
  async getAnalytics(
    @Req() req: Request,
    @Query('days') days: string = '30',
  ) {
    const userId = (req as any).user.userId;

    return this.client
      .send(
        { cmd: 'instructor.analytics.get' },
        { instructorId: userId, days: parseInt(days) },
      )
      .toPromise();
  }
}
