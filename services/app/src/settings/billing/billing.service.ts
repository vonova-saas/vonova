import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserBilling, UserBillingDocument } from 'src/schemas/userBilling.schema';
import { UpdateUserBillingDto } from './dto/billing.dto';

@Injectable()
export class BillingService {

constructor(
    @InjectModel(UserBilling.name)
    private readonly billingModel: Model<UserBillingDocument>,
  ) {}

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

  async getUserBilling(userId: string): Promise<UserBilling> {
    let billing = await this.billingModel.findOne({ userId });
    if (!billing) {
      billing = await this.billingModel.create({
        userId,
        ...this.getDefaultBilling(),
      });
    }
    return billing;
  }

async updateUserBilling(
  userId: string,
  update: UpdateUserBillingDto,
): Promise<Record<string, any>> {
  const billing = await this.billingModel
    .findOneAndUpdate({ userId }, { $set: update }, { new: true, upsert: true })
    .lean();

  if (!billing) throw new NotFoundException('User billing not found');
  return billing;
}

}
