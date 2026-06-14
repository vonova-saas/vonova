import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsMongoId,
  ArrayMaxSize,
  MaxLength,
  Matches,
} from 'class-validator';

const NON_WHITESPACE = /\S/;

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Post content cannot be empty' })
  @MaxLength(5000)
  @Matches(NON_WHITESPACE, { message: 'content cannot be empty / whitespace' })
  content: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(60, { each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  hashtags?: string[];

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS'])
  visibility?: 'PUBLIC' | 'FOLLOWERS';

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  instructorOnly?: boolean;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @Matches(NON_WHITESPACE, { message: 'content cannot be empty / whitespace' })
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(60, { each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  hashtags?: string[];

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS'])
  visibility?: 'PUBLIC' | 'FOLLOWERS';

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  instructorOnly?: boolean;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MaxLength(2000)
  @Matches(NON_WHITESPACE, { message: 'text cannot be empty / whitespace' })
  text: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageKey?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Matches(NON_WHITESPACE, { message: 'text cannot be empty / whitespace' })
  text?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageKey?: string;
}

export class SharePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @Matches(NON_WHITESPACE, {
    message: 'Share comment cannot be only whitespace',
  })
  comment?: string;
}
