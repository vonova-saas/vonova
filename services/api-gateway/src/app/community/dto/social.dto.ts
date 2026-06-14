import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsMongoId,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  IsObject,
  Matches,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';

// Reject whitespace-only strings without rejecting an explicit empty optional.
const NON_WHITESPACE = /\S/;

export class UpdateCommunityProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message: 'username may only contain letters, numbers, _ . -',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  experience?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  github?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  profilePictureUrl?: string;
}

export class CreateDmConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  otherUserId: string;
}

export class SendDmMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  attachments?: string[];

  /**
   * Rich attachment metadata; pass after uploading via the presigned URL.
   * `class-validator` allows unknown objects through (we trim/cast on the
   * microservice side), so plain validation keeps the surface flexible.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  attachmentsMeta?: Array<{
    type: 'IMAGE' | 'VIDEO' | 'PDF' | 'VOICE' | 'FILE';
    url: string;
    key: string;
    mimeType?: string | null;
    size?: number;
    duration?: number | null;
    width?: number | null;
    height?: number | null;
    name?: string | null;
  }>;
}

export class PatchDmMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(NON_WHITESPACE, { message: 'name cannot be empty / whitespace' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  avatar?: string;

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export class MarkNotificationsReadDto {
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  ids?: string[];
}

export class AiConsumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'feature must be UPPER_SNAKE_CASE',
  })
  feature: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  creditsUsed?: number;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class CreateGroupChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(NON_WHITESPACE, { message: 'name cannot be empty / whitespace' })
  name: string;

  @IsOptional()
  @IsEnum(['GENERAL', 'QUESTIONS', 'RESOURCES', 'ANNOUNCEMENTS', 'CUSTOM'])
  type?: 'GENERAL' | 'QUESTIONS' | 'RESOURCES' | 'ANNOUNCEMENTS' | 'CUSTOM';

  @IsOptional()
  isReadOnlyForMembers?: boolean;
}

export class CreateGroupPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Matches(NON_WHITESPACE, { message: 'content cannot be empty / whitespace' })
  content: string;

  @IsOptional()
  @IsMongoId()
  channelId?: string;

  @IsOptional()
  @IsEnum(['DISCUSSION', 'ANNOUNCEMENT', 'QUESTION', 'RESOURCE'])
  postType?: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'RESOURCE';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  hashtags?: string[];

  @IsOptional()
  isPinned?: boolean;
}

export class PresignGroupUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[A-Za-z0-9.+_-]+\/[A-Za-z0-9.+_-]+$/, {
    message: 'contentType must be a valid MIME (type/subtype)',
  })
  contentType: string;

  @IsOptional()
  @IsEnum(['IMAGE', 'VIDEO', 'PDF', 'VOICE', 'FILE'])
  kind?: 'IMAGE' | 'VIDEO' | 'PDF' | 'VOICE' | 'FILE';
}

export class PresignMessageUploadDto extends PresignGroupUploadDto {}

export class MarkConversationSeenDto {
  @IsOptional()
  @IsMongoId()
  messageId?: string;
}

export class ModerationActionDto {
  @IsMongoId()
  targetUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class MuteMemberDto extends ModerationActionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  minutes?: number;
}

export class PinPostDto {
  @IsMongoId()
  postId: string;
}
