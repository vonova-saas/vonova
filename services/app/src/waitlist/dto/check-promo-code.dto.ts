import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class CheckPromoCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  promoCode: string;
}
