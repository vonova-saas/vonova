import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeCourseFeedbackDto {
  @IsMongoId()
  courseId: string;

  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}