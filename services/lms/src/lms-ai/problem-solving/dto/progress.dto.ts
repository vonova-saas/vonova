import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProblemProgressDto {
  @IsOptional()
  @IsBoolean()
  solved?: boolean;

  @IsOptional()
  @IsString()
  lastSubmissionStatus?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attemptsCount?: number;
}

export class UpdateSheetProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentProblemIndex?: number;
}
