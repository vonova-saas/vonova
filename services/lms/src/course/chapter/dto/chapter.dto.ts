import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  ArrayMinSize,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChapterDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;
}

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;
}

export class ReorderChapterItemDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId format for chapterId' })
  chapterId: string;

  @IsInt()
  @Min(1)
  index: number;
}

export class ReorderChaptersDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderChapterItemDto)
  @ArrayMinSize(1)
  order: ReorderChapterItemDto[];
}
