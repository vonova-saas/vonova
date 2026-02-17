import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'system';

  @IsOptional()
  @IsString()
  language?: string;

  // notifications part
  @IsOptional()
  @IsString()
  type?: 'all' | 'mentions' | 'none';

  @IsOptional()
  @IsBoolean()
  communication_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  social_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  security_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  mobile?: boolean;
}
