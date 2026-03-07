import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackDto {
  @ApiPropertyOptional({
    description: 'Type of feedback submission',
    enum: ['bug-report', 'feature-request', 'suggestion', 'other'],
    example: 'bug-report',
    type: String,
  })
  @IsEnum(['bug-report', 'feature-request', 'suggestion', 'other'])
  @IsOptional()
  feedbackType?: string;

  @ApiPropertyOptional({
    description: 'Detailed bug report description',
    example:
      'The application crashes when I try to upload a file larger than 10MB.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userBugReport?: string;

  @ApiPropertyOptional({
    description: 'Feature request description',
    example: 'Please add dark mode support for better user experience.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userFeatureRequest?: string;

  @ApiPropertyOptional({
    description: 'User suggestion or improvement idea',
    example: 'Consider adding keyboard shortcuts for common actions.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userSuggestion?: string;

  @ApiPropertyOptional({
    description: 'Other type of feedback or general comments',
    example: 'Great application! Keep up the good work.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  userOther?: string;

  @ApiPropertyOptional({
    description: 'User email address for follow-up communication',
    example: 'user@example.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'General message or additional feedback',
    example: 'I would like to provide additional context about my feedback.',
    maxLength: 2000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class FeedbackAddMessageDto {
  @ApiProperty({
    description: 'Message to add to feedback thread',
    example:
      'Thank you for addressing my previous concern. The issue has been resolved.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  message: string;
}

export class FeedbackUpdateStatusDto {
  @ApiProperty({
    description: 'New status for the feedback',
    enum: ['open', 'pending', 'resolved', 'closed'],
    example: 'resolved',
    type: String,
  })
  @IsString()
  @IsIn(['open', 'pending', 'resolved', 'closed'])
  status: string;
}
