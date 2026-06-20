import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeCourseFeedbackDto {
  @ApiProperty({
    description: 'Course feedback text to analyze for sentiment',
    example: 'This course was very helpful and well-structured.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}