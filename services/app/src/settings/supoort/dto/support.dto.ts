import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateSupportDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['technical', 'billing', 'general', 'feature-request', 'bug-report'])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class UpdateSupportDto extends PartialType(CreateSupportDto) {}

export class AddMessageDto {
  @IsString()
  @MaxLength(2000)
  message: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsIn(['open', 'pending', 'resolved', 'closed'])
  status: string;
}
