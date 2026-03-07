import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBillingDto {
  @ApiPropertyOptional({
    description: 'Subscription plan type',
    example: 'PREMIUM',
    type: String,
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Credit card number (masked for security)',
    example: '****-****-****-1234',
    type: String,
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({
    description: 'Name on the credit card',
    example: 'John Doe',
    type: String,
  })
  @IsOptional()
  @IsString()
  nameOfCard?: string;

  @ApiPropertyOptional({
    description: 'Card expiry date in MM/YY format',
    example: '12/25',
    type: String,
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Card verification value (3-4 digits)',
    example: '123',
    type: String,
  })
  @IsOptional()
  @IsString()
  cvv?: string;

  @ApiPropertyOptional({
    description: 'Billing email address',
    example: 'billing@example.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @ApiPropertyOptional({
    description: 'Billing address for the card',
    example: '123 Main St, Apt 4B',
    maxLength: 200,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cardAddress?: string;

  @ApiPropertyOptional({
    description: 'Billing city',
    example: 'New York',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Billing country',
    example: 'United States',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Billing ZIP/postal code',
    example: '10001',
    maxLength: 20,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;
}
