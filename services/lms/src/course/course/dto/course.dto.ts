import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUrl,
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
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  trailerUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

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
