import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsMongoId()
  problemId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;
}
