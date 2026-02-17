import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
  IsEnum,
} from 'class-validator';

export class FeedbackDto {
  @IsEnum(['bug-report', 'feature-request', 'suggestion', 'other'])
  @IsOptional()
  feedbackType?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userBugReport?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userFeatureRequest?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userSuggestion?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userOther?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
