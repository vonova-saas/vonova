import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAdminUserStatusDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsBoolean()
  isActive!: boolean;
}
