import { IsString, IsOptional, IsInt, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChapterDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;
}

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;
}

export class ReorderChapterItemDto {
  @IsString()
  chapterId: string;

  @IsInt()
  @Min(0)
  index: number;
}

export class ReorderChaptersDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderChapterItemDto)
  @ArrayMinSize(1)
  order: ReorderChapterItemDto[];
}
