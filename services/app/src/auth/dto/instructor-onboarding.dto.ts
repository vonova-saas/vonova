import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RpcInstructorCvFileDto {
  @IsString()
  originalname: string;

  @IsOptional()
  @IsString()
  mimetype?: string;

  @IsString()
  buffer: string;
}

export class SubmitInstructorOnboardingDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  track: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  experienceYears: number;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsString()
  @IsNotEmpty()
  teachingStyle: string;

  @IsString()
  @IsNotEmpty()
  motivation: string;

  @ValidateNested()
  @Type(() => RpcInstructorCvFileDto)
  file: RpcInstructorCvFileDto;
}
