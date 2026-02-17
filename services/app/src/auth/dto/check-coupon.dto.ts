import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CheckCouponDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
