import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

/** CV is uploaded to S3 by the API gateway; this RPC only receives the resulting HTTPS URL. */
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

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsNotEmpty()
  cvUrl: string;
}
