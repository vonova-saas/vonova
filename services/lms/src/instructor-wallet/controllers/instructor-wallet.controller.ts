import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InstructorWalletService } from '../services/instructor-wallet.service';

/**
 * Instructor Wallet Controller (LMS Microservice)
 * 
 * Handles NATS message patterns for wallet operations
 */
@Controller()
export class InstructorWalletController {
  private readonly logger = new Logger(InstructorWalletController.name);

  constructor(private readonly walletService: InstructorWalletService) { }

  @MessagePattern({ cmd: 'instructor.wallet.get' })
  async getWallet(@Payload('instructorId') instructorId: string) {
    try {
      const wallet = await this.walletService.getWallet(instructorId);
      return {
        success: true,
        data: wallet,
      };
    } catch (error) {
      this.logger.error('Failed to get wallet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'instructor.earnings.get' })
  async getEarnings(
    @Payload() data: { instructorId: string; days: number },
  ) {
    try {
      const earnings = await this.walletService.getEarningsAnalytics(
        data.instructorId,
        data.days,
      );
      return {
        success: true,
        data: earnings,
      };
    } catch (error) {
      this.logger.error('Failed to get earnings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'instructor.transactions.get' })
  async getTransactions(
    @Payload() data: { instructorId: string; filters: any },
  ) {
    try {
      const result = await this.walletService.getTransactions(
        data.instructorId,
        data.filters,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to get transactions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'instructor.analytics.get' })
  async getAnalytics(
    @Payload() data: { instructorId: string; days: number },
  ) {
    try {
      const wallet = await this.walletService.getWallet(data.instructorId);
      const earnings = await this.walletService.getEarningsAnalytics(
        data.instructorId,
        data.days,
      );

      // Calculate analytics
      const totalSales = wallet.formatted.totalSales || 0;
      const conversionRate = totalSales > 0 ? 100 : 0; // Simplified
      const averageOrderValue = totalSales > 0
        ? (wallet.formatted.totalEarnings / totalSales)
        : 0;

      const topCourse = earnings.byCourse[0]?.courseName || 'N/A';

      return {
        success: true,
        data: {
          conversionRate,
          averageOrderValue,
          topPerformingCourse: topCourse,
          monthlyGrowth: 0, // Calculate from earnings.monthly
          wallet: wallet.formatted,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get analytics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
