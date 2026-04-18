import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StudentOnboardingBodyDto {
  @ApiProperty({ example: 'Software Engineering' })
  @IsString()
  @IsNotEmpty()
  track: string;

  @ApiProperty({ example: 'Intermediate' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: 'Get hired as a full-stack developer' })
  @IsString()
  @IsNotEmpty()
  goal: string;

  @ApiProperty({ example: '2 years coding, no professional experience' })
  @IsString()
  @IsNotEmpty()
  experience: string;

  @ApiProperty({ example: '10 hours per week' })
  @IsString()
  @IsNotEmpty()
  timeCommitment: string;
}
