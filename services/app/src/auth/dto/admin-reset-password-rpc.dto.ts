import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/** NATS payload for `adminResetPassword` (access token + credentials). */
export class AdminResetPasswordRpcDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}
