import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
