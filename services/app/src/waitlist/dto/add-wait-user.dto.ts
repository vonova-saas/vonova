import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class AddWaitUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}
