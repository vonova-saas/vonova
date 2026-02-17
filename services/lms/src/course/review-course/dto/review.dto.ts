import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewCourseDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  body?: string;
}
