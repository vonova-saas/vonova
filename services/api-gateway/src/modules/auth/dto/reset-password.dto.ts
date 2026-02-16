import { IsEmail, IsString, MinLength, MaxLength, Matches, Length } from 'class-validator';

export class RequestResetPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Reset code must contain only numbers' })
  code!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword!: string;
}

