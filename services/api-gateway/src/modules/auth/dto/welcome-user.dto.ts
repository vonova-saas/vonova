import { IsEmail, IsString, IsIn } from 'class-validator';
import { Roles } from '../../../enums/role.enum';

export class WelcomeUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn([Roles.STUDENT_USER, Roles.INSTRUCTORS_USER])
  role!: string;

  @IsString()
  answerOne!: string;
}

