import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class PresignDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @Min(1)
  size: number;
}

export class CompleteDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  objectKey: string;
}
