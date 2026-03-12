import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class UploadPdfDto {
  @ApiProperty({
    description: 'Whether to automatically generate summary after upload',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  auto_summarize?: boolean;

  @ApiProperty({
    description: 'Type of summary to generate',
    enum: ['brief', 'detailed', 'comprehensive'],
    example: 'brief',
    required: false,
  })
  @IsOptional()
  @IsEnum(['brief', 'detailed', 'comprehensive'])
  summary_type?: 'brief' | 'detailed' | 'comprehensive';

  @ApiProperty({
    description:
      'Language code for the PDF (ISO 639-1, e.g., en, es, fr, de, ar)',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}

/** Body for POST /chat when using session_id in query: only question and context_length. */
export class ChatWithPdfBodyDto {
  @ApiProperty({
    description: 'Question to ask about the PDF',
    example: 'What are the main conclusions of this research?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Context length for the response',
    example: 1000,
    minimum: 100,
    maximum: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  context_length?: number;
}

export class ChatWithPdfDto {
  @ApiProperty({
    description:
      'Session ID (can also be passed as query param session_id). Required in body or query.',
    example: 'session-uuid-456',
    required: false,
  })
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiProperty({
    description: 'Question to ask about the PDF',
    example: 'What are the main conclusions of this research?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Context length for the response',
    example: 1000,
    minimum: 100,
    maximum: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  context_length?: number;
}

export class RateChatResponseDto {
  @ApiProperty({
    description: 'Chat ID to rate',
    example: 'chat-uuid-789',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'Rating value (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class BulkDeleteSessionsDto {
  @ApiProperty({
    description: 'Array of session IDs to delete',
    example: ['session-id-1', 'session-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  session_ids: string[];
}
