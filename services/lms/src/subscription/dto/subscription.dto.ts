import { IsString, IsOptional, IsEnum, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsEnum(['FREE', 'PRO'])
  plan: 'FREE' | 'PRO';

  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(['FREE', 'PRO'])
  plan?: 'FREE' | 'PRO';

  @IsOptional()
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle?: 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}

export class SubscriptionResponseDto {
  _id: string;
  userId: string;
  plan: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
