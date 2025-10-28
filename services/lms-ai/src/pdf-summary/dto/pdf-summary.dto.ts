import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class UploadPdfDto {
  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    description: 'Whether to automatically generate summary after upload',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  auto_summarize?: boolean;

  @ApiProperty({
    description: 'Type of summary to generate',
    enum: ['brief', 'detailed', 'comprehensive'],
    example: 'brief',
    required: false
  })
  @IsOptional()
  @IsEnum(['brief', 'detailed', 'comprehensive'])
  summary_type?: 'brief' | 'detailed' | 'comprehensive';
}

export class ChatWithPdfDto {
  @ApiProperty({
    description: 'Session ID returned from upload',
    example: 'session-uuid-456'
  })
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @ApiProperty({
    description: 'Question to ask about the PDF',
    example: 'What are the main conclusions of this research?'
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    description: 'Context length for the response',
    example: 1000,
    minimum: 100,
    maximum: 5000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  context_length?: number;
}

export class GetSessionChatHistoryParamsDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'session-uuid-456'
  })
  @IsString()
  sessionId: string;
}

export class GetSessionChatHistoryQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetFullSummaryQueryDto {
  @ApiProperty({
    description: 'Session ID returned from upload',
    example: 'session-uuid-456'
  })
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  user_id?: string;
}

export class RateChatResponseDto {
  @ApiProperty({
    description: 'Chat ID to rate',
    example: 'chat-uuid-789'
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

// Response DTOs
export class PdfSummaryResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'This document discusses...' })
  summary: string;

  @ApiProperty({ example: 'detailed' })
  summary_type: string;

  @ApiProperty({ example: 'document.pdf' })
  filename: string;

  @ApiProperty({ example: 'session-uuid-456' })
  session_id: string;

  @ApiProperty({
    type: 'object',
    properties: {
      generated: { type: 'string', format: 'date-time' },
      ai_model_used: { type: 'string', example: 'gemini' },
      processing_time_ms: { type: 'number', example: 1500 },
      file_size_bytes: { type: 'number', example: 1024000 },
      total_pages: { type: 'number', example: 25 }
    }
  })
  metadata: {
    generated: string;
    ai_model_used: string;
    processing_time_ms: number;
    file_size_bytes: number;
    total_pages: number;
  };
}

export class PdfUploadResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'session-uuid-456' })
  session_id: string;

  @ApiProperty({ example: 'This document contains...' })
  brief_summary: string;

  @ApiProperty({ example: 'user-uuid-123', required: false })
  user_id?: string;

  @ApiProperty({ example: 'normal' })
  magic_level: string;

  @ApiProperty({ example: 'uploaded' })
  enchantment_status: string;

  @ApiProperty({ example: 'PDF uploaded successfully' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      filename: { type: 'string', example: 'document.pdf' },
      file_size_bytes: { type: 'number', example: 1024000 },
      total_pages: { type: 'number', example: 25 },
      processing_time_ms: { type: 'number', example: 500 }
    }
  })
  metadata: {
    filename: string;
    file_size_bytes: number;
    total_pages: number;
    processing_time_ms: number;
  };
}

export class PdfChatResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Based on the document...' })
  answer: string;

  @ApiProperty({ example: 'session-uuid-456' })
  session_id: string;

  @ApiProperty({ example: 'document.pdf' })
  filename: string;

  @ApiProperty({ example: 'user-uuid-123', required: false })
  user_id?: string;

  @ApiProperty({ example: 'active' })
  ai_wizard_status: string;

  @ApiProperty({ example: 'normal' })
  magic_level: string;

  @ApiProperty({ example: 'Chat response generated successfully' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      generated: { type: 'string', format: 'date-time' },
      ai_model_used: { type: 'string', example: 'gemini' },
      response_time_ms: { type: 'number', example: 800 },
      tokens_used: { type: 'number', example: 150 }
    }
  })
  metadata: {
    generated: string;
    ai_model_used: string;
    response_time_ms: number;
    tokens_used: number;
  };
}
