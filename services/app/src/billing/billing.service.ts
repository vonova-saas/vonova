import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserBilling } from './schema/billing.schema';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(UserBilling.name)
    private readonly billingModel: Model<UserBilling>,
  ) {}

  async onModuleInit() {
    try {
      await this.billingModel.syncIndexes();
    } catch (err) {
      this.logger.warn(
        `UserBilling syncIndexes skipped: ${(err as Error).message}`,
      );
    }
  }

  private getDefaultBilling() {
    return {
      plan: 'basic',
      cardNumber: '4242424242424242',
      nameOfCard: 'John Doe',
      expiryDate: 'MM/YY',
      cvv: '123',
      billingEmail: 'billing@example.com',
      cardAddress: '123 Main St',
      city: 'Cairo',
      country: 'Egypt',
      zipCode: '10001',
    };
  }

  async findOne(userId: string) {
    let billing = await this.billingModel.findOne({ userId });
    if (!billing) {
      try {
        billing = await this.billingModel.create({
          userId,
          ...this.getDefaultBilling(),
        });
      } catch (err: unknown) {
        const code = (err as { code?: number })?.code;
        // Parallel first-fetch for same user, or legacy index issues
        if (code === 11000) {
          billing = await this.billingModel.findOne({ userId });
        }
        if (!billing) {
          throw err;
        }
      }
    }
    return { message: 'User billing fetched successfully', data: billing };
  }

  async update(userId: string, update: UpdateBillingDto) {
    const billing = await this.billingModel
      .findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, upsert: true },
      )
      .lean();

    if (!billing) {
      throw new RpcException({
        statusCode: 404,
        message: `User billing with id '${userId}' not found`,
      });
    }
    return { message: 'User billing updated successfully', data: billing };
  }
}
