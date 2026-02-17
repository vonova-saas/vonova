import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedbackDto } from './create-feedback.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
