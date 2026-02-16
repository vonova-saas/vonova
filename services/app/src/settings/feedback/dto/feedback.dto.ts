import {
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class CreateFeedbackDto {
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

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateFeedbackDto extends CreateFeedbackDto {}

export class CreateMessageDto {
  @IsString()
  @MaxLength(2000)
  message: string;
}

// dto/update-status.dto.ts
export class UpdateStatusDto {
  @IsEnum(['open', 'pending', 'resolved', 'closed'])
  status: string;
}
