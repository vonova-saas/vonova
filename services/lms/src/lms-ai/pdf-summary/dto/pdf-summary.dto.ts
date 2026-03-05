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
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class UploadPdfDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsBoolean()
  auto_summarize?: boolean;

  @IsOptional()
  @IsEnum(['brief', 'detailed', 'comprehensive'])
  summary_type?: 'brief' | 'detailed' | 'comprehensive';

  @IsOptional()
  @IsString()
  language?: string;
}

export class ChatWithPdfDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  context_length?: number;
}

export class GetSessionChatHistoryParamsDto {
  @IsString()
  sessionId: string;
}

export class GetSessionChatHistoryQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetFullSummaryQueryDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}

export class RateChatResponseDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}

// Response DTOs (no validation needed - these are response types)
export class PdfSummaryResponseDto {
  status: boolean;
  summary: string;
  summary_type: string;
  filename: string;
  session_id: string;
  metadata: {
    generated: string;
    ai_model_used: string;
    processing_time_ms: number;
    file_size_bytes: number;
    total_pages: number;
  };
}

export class PdfUploadResponseDto {
  status: boolean;
  session_id: string;
  brief_summary: string;
  user_id?: string;
  magic_level: string;
  enchantment_status: string;
  message: string;
  metadata: {
    filename: string;
    file_size_bytes: number;
    total_pages: number;
    processing_time_ms: number;
    s3_key?: string;
    s3_url?: string;
  };
}

export class PdfChatResponseDto {
  status: boolean;
  answer: string;
  session_id: string;
  filename: string;
  user_id?: string;
  ai_wizard_status: string;
  magic_level: string;
  message: string;
  metadata: {
    generated: string;
    ai_model_used: string;
    response_time_ms: number;
    tokens_used: number;
  };
}

// Batch Operations DTOs
export class BulkDeleteSessionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  session_ids: string[];

  @IsOptional()
  @IsString()
  user_id?: string;
}

export class BulkDeleteResponseDto {
  success: boolean;
  message: string;
  data: {
    total_requested: number;
    deleted: number;
    failed: number;
    failed_session_ids: string[];
  };
}

// Analytics DTOs
export class QueryAnalyticsDto {
  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}

export class QueryAnalyticsResponseDto {
  success: boolean;
  message: string;
  data: {
    total_queries: number;
    average_response_time_ms: number;
    most_common_queries: Array<{ query: string; count: number }>;
    queries_by_hour: Array<{ hour: string; count: number }>;
    average_rating: number;
    language_distribution: Record<string, number>;
  };
}
