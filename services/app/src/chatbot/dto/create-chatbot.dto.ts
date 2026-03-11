import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ─── Enums ─────────────────────────────────────────────────────────────── */

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/* ─── Chatbot DTOs ───────────────────────────────────────────────────────── */

export class CreateChatbotMessageDto {
  @ApiProperty({
    description: 'Unique chat identifier (conversation level)',
    example: 'chat_123456',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'Session identifier for the current user session',
    example: 'session_abc789',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Message content sent to the chatbot',
    maxLength: 4000,
    example: 'Hello, I need help with my order',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({
    description: 'Role of the message sender',
    enum: ChatRole,
    default: ChatRole.USER,
  })
  @IsOptional()
  @IsEnum(ChatRole)
  role?: ChatRole = ChatRole.USER;
}

/* ─── Optional: Update Message DTO ───────────────────────────────────────── */

export class UpdateChatbotMessageDto {
  @ApiPropertyOptional({
    description: 'Updated message content',
    maxLength: 4000,
    example: 'Updated message text',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message?: string;
}

/* ─── Optional: Query / Filter DTO ───────────────────────────────────────── */

export class ChatbotQueryDto {
  @ApiPropertyOptional({
    description: 'Filter messages by chatId',
    example: 'chat_123456',
  })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiPropertyOptional({
    description: 'Filter messages by sessionId',
    example: 'session_abc789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
