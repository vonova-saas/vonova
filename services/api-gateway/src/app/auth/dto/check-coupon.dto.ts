import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCouponDto {
  @ApiProperty({
    description: "User's email address for coupon validation",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Coupon code to validate',
    example: 'WELCOME20',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @ApiProperty({
    description: 'User ID associated with the coupon request',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
