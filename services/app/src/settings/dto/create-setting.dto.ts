import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateSettingDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  theme?: 'light' | 'dark' | 'system';

  @IsNotEmpty()
  @IsString()
  language?: string;

  // notifications part
  @IsNotEmpty()
  @IsString()
  type: 'all' | 'mentions' | 'none';

  @IsNotEmpty()
  @IsBoolean()
  communication_emails: boolean;

  @IsNotEmpty()
  @IsBoolean()
  marketing_emails: boolean;

  @IsNotEmpty()
  @IsBoolean()
  social_emails: boolean;

  @IsNotEmpty()
  @IsBoolean()
  security_emails: boolean;

  @IsNotEmpty()
  @IsBoolean()
  mobile: boolean;
}
