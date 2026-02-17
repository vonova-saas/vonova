import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';

export class EnrollCourseDto {
  @IsOptional()
  @IsString()
  couponCode?: string;
}


