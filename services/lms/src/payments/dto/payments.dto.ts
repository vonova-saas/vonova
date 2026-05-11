import { IsString, IsNumber, IsOptional, IsEnum, Min, IsMongoId } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  userId: string;

  @IsEnum(['SUBSCRIPTION', 'COURSE', 'MATERIAL'])
  type: 'SUBSCRIPTION' | 'COURSE' | 'MATERIAL';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsMongoId()
  materialId?: string;

  @IsOptional()
  @IsMongoId()
  subscriptionId?: string;
}

export class UpdatePaymentStatusDto {
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

  @IsOptional()
  @IsString()
  providerPaymentId?: string;
}

export class CreateCheckoutSessionDto {
  @IsMongoId()
  userId: string;

  @IsString()
  email: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}

export class PaymentResponseDto {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  description: string;
  providerPaymentId?: string;
  courseId?: string;
  materialId?: string;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
