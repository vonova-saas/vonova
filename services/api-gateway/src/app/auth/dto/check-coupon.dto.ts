import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

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
