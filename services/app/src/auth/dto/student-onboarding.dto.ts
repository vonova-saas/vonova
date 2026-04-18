import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class SubmitStudentOnboardingDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  track: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsString()
  @IsNotEmpty()
  timeCommitment: string;
}
