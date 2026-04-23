import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestHintDto {
  @IsMongoId()
  problemId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  languageHint?: string;
}

export class RequestSolutionDto {
  @IsMongoId()
  problemId: string;

  @IsString()
  @IsOptional()
  language?: string;
}
