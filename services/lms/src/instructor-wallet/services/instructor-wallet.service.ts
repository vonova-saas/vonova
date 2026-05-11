import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../schemas/transaction.schema';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';

export interface WalletBalance {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnAmount: number;
  refundedAmount: number;
  platformCommission: number;
  processingFees: number;
  totalSales: number;
  totalRefunds: number;
}

export interface EarningsBreakdown {
  daily: { date: string; amount: number }[];
  weekly: { week: string; amount: number }[];
  monthly: { month: string; amount: number }[];
  byCourse: { courseId: string; courseName: string; amount: number; sales: number }[];
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  courseId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Instructor Wallet Service
 * 
 * Enterprise-grade wallet management with:
 * - Real-time balance aggregation
 * - Transaction history
 * - Earnings analytics
 * - Performance optimized with MongoDB aggregation
 */
@Injectable()
export class InstructorWalletService {
  private readonly logger = new Logger(InstructorWalletService.name);

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  // ==================== WALLET BALANCE ====================

  /**
   * Get instructor wallet with real-time balance calculation
   */
  async getWallet(instructorId: string): Promise<Wallet & { formatted: WalletBalance }> {
    let wallet = await this.walletModel.findOne({
      instructorId: new Types.ObjectId(instructorId),
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await this.walletModel.create({
        instructorId: new Types.ObjectId(instructorId),
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
      });
    }

    // Recalculate from transactions for accuracy
    const balances = await this.calculateBalances(instructorId);

    // Update wallet with calculated balances
    await this.walletModel.updateOne(
      { _id: wallet._id },
      {
        $set: {
          ...balances,
          lastCalculatedAt: new Date(),
          lastCalculationMethod: 'realtime',
        },
      },
    );

    return {
      ...wallet.toObject(),
      ...balances,
      formatted: this.formatBalances(balances),
    } as Wallet & { formatted: WalletBalance };
  }

  /**
   * Calculate balances from transactions using aggregation
   */
  private async calculateBalances(instructorId: string): Promise<Partial<Wallet>> {
    const pipeline = [
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: '$type',
          totalNet: { $sum: '$netAmount' },
          totalGross: { $sum: '$grossAmount' },
          platformFee: { $sum: '$platformFee' },
          processingFee: { $sum: '$processingFee' },
          refundAmount: { $sum: '$refundAmount' },
          count: { $sum: 1 },
        },
      },
    ];

    const results = await this.transactionModel.aggregate(pipeline);

    let totalEarnings = 0;
    let platformCommission = 0;
    let processingFees = 0;
    let refundedAmount = 0;
    let totalSales = 0;
    let totalRefunds = 0;

    results.forEach((result) => {
      if (result._id === TransactionType.COURSE_SALE || result._id === TransactionType.MATERIAL_SALE) {
        totalEarnings += result.totalNet;
        platformCommission += result.platformFee;
        processingFees += result.processingFee;
        totalSales += result.count;
      } else if (result._id === TransactionType.REFUND) {
        refundedAmount += result.totalNet;
        totalRefunds += result.count;
      } else if (result._id === TransactionType.PAYOUT) {
        // Payouts reduce available balance
      }
    });

    // Calculate available vs pending
    const pendingCutoff = new Date();
    pendingCutoff.setDate(pendingCutoff.getDate() - 7); // 7-day hold period

    const pendingAgg = await this.transactionModel.aggregate([
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
          type: { $in: [TransactionType.COURSE_SALE, TransactionType.MATERIAL_SALE] },
          settledAt: { $exists: false },
          createdAt: { $lt: pendingCutoff },
        },
      },
      {
        $group: {
          _id: null,
          pendingTotal: { $sum: '$netAmount' },
        },
      },
    ]);

    const pendingBalance = pendingAgg[0]?.pendingTotal || 0;
    const availableBalance = Math.max(0, totalEarnings - refundedAmount - pendingBalance);

    return {
      totalEarnings,
      availableBalance,
      pendingBalance,
      refundedAmount,
      platformCommission,
      processingFees,
      totalSales,
      totalRefunds,
    };
  }

  /**
   * Format balances for frontend display
   */
  private formatBalances(balances: Partial<Wallet>): WalletBalance {
    return {
      totalEarnings: this.centsToDollars(balances.totalEarnings || 0),
      availableBalance: this.centsToDollars(balances.availableBalance || 0),
      pendingBalance: this.centsToDollars(balances.pendingBalance || 0),
      withdrawnAmount: this.centsToDollars(balances.withdrawnAmount || 0),
      refundedAmount: this.centsToDollars(balances.refundedAmount || 0),
      platformCommission: this.centsToDollars(balances.platformCommission || 0),
      processingFees: this.centsToDollars(balances.processingFees || 0),
      totalSales: balances.totalSales || 0,
      totalRefunds: balances.totalRefunds || 0,
    };
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Get instructor transactions with filtering
   */
  async getTransactions(
    instructorId: string,
    filters: TransactionFilters = {},
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const query: any = { instructorId: new Types.ObjectId(instructorId) };

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.courseId) query.courseId = new Types.ObjectId(filters.courseId);
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('studentId', 'name email')
        .populate('courseId', 'title')
        .lean(),
      this.transactionModel.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Create transaction record
   */
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = await this.transactionModel.create({
      ...data,
      currency: data.currency || 'usd',
    });

    // Trigger wallet recalculation
    await this.recalculateWallet(data.instructorId!.toString());

    return transaction;
  }

  // ==================== EARNINGS ANALYTICS ====================

  /**
   * Get earnings breakdown by time period and course
   */
  async getEarningsAnalytics(instructorId: string, days: number = 30): Promise<EarningsBreakdown> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [daily, weekly, monthly, byCourse] = await Promise.all([
      this.getDailyEarnings(instructorId, startDate),
      this.getWeeklyEarnings(instructorId, startDate),
      this.getMonthlyEarnings(instructorId),
      this.getEarningsByCourse(instructorId, startDate),
    ]);

    return { daily, weekly, monthly, byCourse };
  }

  /**
   * Daily earnings aggregation
   */
  private async getDailyEarnings(instructorId: string, startDate: Date) {
    const pipeline = [
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
          type: { $in: [TransactionType.COURSE_SALE, TransactionType.MATERIAL_SALE] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$netAmount' },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const results = await this.transactionModel.aggregate(pipeline);

    return results.map((r) => ({
      date: r._id,
      amount: this.centsToDollars(r.amount),
    }));
  }

  /**
   * Weekly earnings aggregation
   */
  private async getWeeklyEarnings(instructorId: string, startDate: Date) {
    const pipeline = [
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
          type: { $in: [TransactionType.COURSE_SALE, TransactionType.MATERIAL_SALE] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
          amount: { $sum: '$netAmount' },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const results = await this.transactionModel.aggregate(pipeline);

    return results.map((r) => ({
      week: r._id,
      amount: this.centsToDollars(r.amount),
    }));
  }

  /**
   * Monthly earnings aggregation
   */
  private async getMonthlyEarnings(instructorId: string) {
    const pipeline = [
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
          type: { $in: [TransactionType.COURSE_SALE, TransactionType.MATERIAL_SALE] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          amount: { $sum: '$netAmount' },
        },
      },
      { $sort: { _id: -1 as const } },
      { $limit: 12 },
    ];

    const results = await this.transactionModel.aggregate(pipeline);

    return results.map((r) => ({
      month: r._id,
      amount: this.centsToDollars(r.amount),
    }));
  }

  /**
   * Earnings breakdown by course
   */
  private async getEarningsByCourse(instructorId: string, startDate: Date) {
    const pipeline = [
      {
        $match: {
          instructorId: new Types.ObjectId(instructorId),
          status: TransactionStatus.COMPLETED,
          type: TransactionType.COURSE_SALE,
          courseId: { $exists: true },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$courseId',
          amount: { $sum: '$netAmount' },
          sales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      { $sort: { amount: -1 as const } },
      { $limit: 10 },
    ];

    const results = await this.transactionModel.aggregate(pipeline);

    return results.map((r) => ({
      courseId: r._id.toString(),
      courseName: r.course.title,
      amount: this.centsToDollars(r.amount),
      sales: r.sales,
    }));
  }

  // ==================== HELPER METHODS ====================

  /**
   * Recalculate wallet balances
   */
  async recalculateWallet(instructorId: string): Promise<void> {
    const balances = await this.calculateBalances(instructorId);

    await this.walletModel.findOneAndUpdate(
      { instructorId: new Types.ObjectId(instructorId) },
      {
        $set: {
          ...balances,
          lastCalculatedAt: new Date(),
          lastCalculationMethod: 'scheduled',
        },
      },
      { upsert: true },
    );
  }

  /**
   * Convert cents to dollars for display
   */
  private centsToDollars(cents: number): number {
    return Math.round((cents / 100) * 100) / 100;
  }
}
