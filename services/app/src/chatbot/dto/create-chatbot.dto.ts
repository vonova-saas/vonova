import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsEnum,
} from 'class-validator';

/* ─── Enums ─────────────────────────────────────────────────────────────── */

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/* ─── Chatbot DTOs ───────────────────────────────────────────────────────── */

export class CreateChatbotMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsEnum(ChatRole)
  role?: ChatRole = ChatRole.USER;
}

/* ─── Optional: Update Message DTO ───────────────────────────────────────── */

export class UpdateChatbotMessageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message?: string;
}

/* ─── Optional: Query / Filter DTO ───────────────────────────────────────── */

export class ChatbotQueryDto {
  @IsOptional()
  @IsString()
  chatId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
