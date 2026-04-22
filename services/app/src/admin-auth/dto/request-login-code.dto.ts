import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestLoginCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
