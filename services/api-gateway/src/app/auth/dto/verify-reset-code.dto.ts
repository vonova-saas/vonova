import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
