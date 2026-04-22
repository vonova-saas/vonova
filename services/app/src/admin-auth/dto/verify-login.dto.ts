import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Code must be exactly 6 characters' })
  code: string;
}
