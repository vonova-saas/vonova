import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportDto {
  @ApiPropertyOptional({
    description: 'Full name of the person submitting the support request',
    example: 'John Doe',
    type: String,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Email address for contact and follow-up',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Category of the support request',
    enum: ['technical', 'billing', 'general', 'feature-request', 'bug-report'],
    example: 'technical',
    type: String,
  })
  @IsOptional()
  @IsIn(['technical', 'billing', 'general', 'feature-request', 'bug-report'])
  category?: string;

  @ApiPropertyOptional({
    description: 'Subject line for the support request',
    example: 'Login issue with my account',
    maxLength: 200,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Detailed message describing the support issue',
    example: 'I am unable to log in to my account using my email and password. I have tried resetting my password but the issue persists.',
    maxLength: 2000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class AddMessageDto {
  @ApiProperty({
    description: 'Message to add to the support ticket thread',
    example: 'Thank you for your assistance. The issue has been resolved on my end.',
    maxLength: 2000,
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  message: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the support ticket',
    enum: ['open', 'pending', 'resolved', 'closed'],
    example: 'resolved',
    type: String,
  })
  @IsString()
  @IsIn(['open', 'pending', 'resolved', 'closed'])
  status: string;
}
