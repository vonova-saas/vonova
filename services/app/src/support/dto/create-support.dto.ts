import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

/** Body fields only; `userId` is supplied on the NATS payload, not in createSupportDto. */
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
