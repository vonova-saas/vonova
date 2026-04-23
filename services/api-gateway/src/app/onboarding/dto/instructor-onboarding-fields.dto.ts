import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/**
 * Text fields for instructor onboarding (multipart body).
 * Use with ValidationPipe `transform: true` so `experienceYears` is coerced from form strings.
 */
export class InstructorOnboardingFieldsDto {
  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  track: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  experienceYears: number;

  @ApiProperty({
    example: 'Former lecturer; focus on practical projects.',
  })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({ example: 'Hands-on workshops and code reviews' })
  @IsString()
  @IsNotEmpty()
  teachingStyle: string;

  @ApiProperty({ example: 'Help learners transition into tech careers' })
  @IsString()
  @IsNotEmpty()
  motivation: string;
}
