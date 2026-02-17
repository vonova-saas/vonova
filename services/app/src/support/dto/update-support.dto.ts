import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportDto } from './create-support.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSupportDto extends PartialType(CreateSupportDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
