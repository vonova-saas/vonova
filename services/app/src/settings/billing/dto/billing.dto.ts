import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserBillingDto {
  @IsOptional() @IsString()
  plan?: string;

  @IsOptional() @IsString()
  cardNumber?: string;

  @IsOptional() @IsString()
  nameOfCard?: string;

  @IsOptional() @IsString()
  expiryDate?: string;

  @IsOptional() @IsString()
  cvv?: string;

  @IsOptional() @IsEmail()
  billingEmail?: string;

  @IsOptional() @IsString() @MaxLength(200)
  cardAddress?: string;

  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @IsOptional() @IsString() @MaxLength(100)
  country?: string;

  @IsOptional() @IsString() @MaxLength(20)
  zipCode?: string;
}
