import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsIn,
} from 'class-validator';

export class CoursePriceDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsBoolean()
  isFree: boolean;
}

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  smallDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  level?: string;

  @IsOptional()
  @IsIn([
    'PROGRAMMING_BASICS',
    'WEB_DEVELOPMENT',
    'FRONTEND',
    'BACKEND',
    'FULLSTACK',
    'FLUTTER',
    'MOBILE',
    'AI',
    'DATA_SCIENCE',
    'CYBER_SECURITY',
    'DEVOPS',
    'UI_UX',
    'DATABASE',
    'PROBLEM_SOLVING',
    'INTERVIEW',
    'OTHER',
  ])
  category?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: string;

  @IsOptional()
  price?: CoursePriceDto;
}

export class UpdateCourseDto extends CreateCourseDto {
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export class PublishCourseDto {
  @IsEnum(['PUBLISHED', 'ARCHIVED'])
  status: 'PUBLISHED' | 'ARCHIVED';
}
