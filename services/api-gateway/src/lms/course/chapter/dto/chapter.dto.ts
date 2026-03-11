import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChapterDto {
  @ApiProperty({
    description: 'Title of the chapter',
    example: 'Introduction to JavaScript',
    type: String,
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Order index of the chapter within the course',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;
}

export class UpdateChapterDto {
  @ApiPropertyOptional({
    description: 'Updated title of the chapter',
    example: 'Advanced JavaScript Concepts',
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated order index of the chapter within the course',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;
}

export class ReorderChapterItemDto {
  @ApiProperty({
    description: 'ID of the chapter to reorder',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId format for chapterId' })
  chapterId: string;

  @ApiProperty({
    description: 'New index position for chapter',
    example: 3,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  index: number;
}

export class ReorderChaptersDto {
  @ApiProperty({
    description: 'Array of chapters with their new order positions',
    type: [ReorderChapterItemDto],
    minItems: 1,
  })
  @ValidateNested({ each: true })
  @Type(() => ReorderChapterItemDto)
  @ArrayMinSize(1)
  order: ReorderChapterItemDto[];
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 1 ? 10 : (num > 100 ? 100 : num);
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class ChaptersPaginatedResponseDto {
  @ApiProperty({
    description: 'Array of chapters',
    type: Array,
    items: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Introduction to JavaScript' },
        index: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  chapters: any[];

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: Number,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
    type: Number,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of chapters',
    example: 47,
    type: Number,
  })
  totalChapters: number;

  @ApiProperty({
    description: 'Number of chapters per page',
    example: 10,
    type: Number,
  })
  limit: number;
}
