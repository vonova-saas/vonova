import { IsString, MinLength, IsIn } from 'class-validator';
import { Roles } from '../../../enums/role.enum';

export class ValidateRoleChangeDto {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsString()
  @IsIn([Roles.STUDENT_USER, Roles.INSTRUCTORS_USER])
  newRole!: string;

  @IsString()
  @MinLength(1)
  adminUserId!: string;
}

