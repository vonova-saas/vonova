import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollCourseDto {
  @ApiPropertyOptional({
    description: 'Optional coupon code for discount or special access',
    example: 'SAVE20',
    type: String,
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
