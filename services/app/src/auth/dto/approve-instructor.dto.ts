import { IsMongoId } from 'class-validator';

export class ApproveInstructorDto {
  @IsMongoId()
  instructorId: string;
}
