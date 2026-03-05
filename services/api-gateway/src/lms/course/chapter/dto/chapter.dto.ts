import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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
    example: 0,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
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
    example: 1,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;
}

export class ReorderChapterItemDto {
  @ApiProperty({
    description: 'ID of the chapter to reorder',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  chapterId: string;

  @ApiProperty({
    description: 'New index position for the chapter',
    example: 2,
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
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
