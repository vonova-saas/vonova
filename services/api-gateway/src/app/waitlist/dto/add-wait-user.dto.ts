import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWaitUserDto {
  @ApiProperty({
    description: 'Email address for waitlist registration',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Full name of the person joining the waitlist',
    example: 'John Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class CheckPromoCodeDto {
  @ApiProperty({
    description: 'Email address to check promo code for',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Promo code to validate',
    example: 'EARLYBIRD20',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  promoCode: string;
}
