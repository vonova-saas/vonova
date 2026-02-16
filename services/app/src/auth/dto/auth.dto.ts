import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Valid email address (will be converted to lowercase)',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsNotEmpty()
  password!: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address to verify',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit verification code sent to email',
    pattern: '^\\d{6}$',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  @IsNotEmpty()
  otp_code!: string;
}

export class WelcomeEmailDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'STUDENT_USER',
    description: 'User role: STUDENT_USER or INSTRUCTORS_USER',
    enum: ['STUDENT_USER', 'INSTRUCTORS_USER'],
  })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({
    example: 'Math, Physics, Web Development',
    description:
      'Answer 1: For STUDENT_USER - "What subjects are you most interested in?". For INSTRUCTORS_USER - "What subjects will you teach?"',
  })
  @IsString()
  @IsNotEmpty()
  answerOne!: string;

  @ApiProperty({
    example: 'Beginner',
    description:
      'Answer 2: For STUDENT_USER - "What is your current level?". For INSTRUCTORS_USER - "How many years of teaching experience do you have?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerTwo?: string;

  @ApiProperty({
    example: 'Pass a certification, Improve grades, Build a project',
    description:
      'Answer 3: For STUDENT_USER - "What is your primary learning goal for the next 3 months?". For INSTRUCTORS_USER - "What content format do you prefer?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerThree?: string;

  @ApiProperty({
    example: '3, 5, 10+',
    description:
      'Answer 4: For STUDENT_USER - "How many hours per week can you study?". For INSTRUCTORS_USER - "What class size do you prefer?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerFour?: string;

  @ApiProperty({
    example: 'Video lessons, Live sessions, Self-paced',
    description:
      'Answer 5: For STUDENT_USER - "Preferred learning style". For INSTRUCTORS_USER - "Your primary goal on Vonova"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerFive?: string;
}

export class WelcomeOAuthGoogleDto {
  @ApiProperty({
    example: 'STUDENT_USER',
    description: 'User role: STUDENT_USER or INSTRUCTORS_USER',
    enum: ['STUDENT_USER', 'INSTRUCTORS_USER'],
  })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({
    example: 'Math, Physics, Web Development',
    description:
      'Answer 1: For STUDENT_USER - "What subjects are you most interested in?". For INSTRUCTORS_USER - "What subjects will you teach?"',
  })
  @IsString()
  @IsNotEmpty()
  answerOne!: string;

  @ApiProperty({
    example: 'Beginner',
    description:
      'Answer 2: For STUDENT_USER - "What is your current level?". For INSTRUCTORS_USER - "How many years of teaching experience do you have?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerTwo?: string;

  @ApiProperty({
    example: 'Pass a certification, Improve grades, Build a project',
    description:
      'Answer 3: For STUDENT_USER - "What is your primary learning goal for the next 3 months?". For INSTRUCTORS_USER - "What content format do you prefer?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerThree?: string;

  @ApiProperty({
    example: '3, 5, 10+',
    description:
      'Answer 4: For STUDENT_USER - "How many hours per week can you study?". For INSTRUCTORS_USER - "What class size do you prefer?"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerFour?: string;

  @ApiProperty({
    example: 'Video lessons, Live sessions, Self-paced',
    description:
      'Answer 5: For STUDENT_USER - "Preferred learning style". For INSTRUCTORS_USER - "Your primary goal on Vonova"',
    required: false,
  })
  @IsString()
  @IsOptional()
  answerFive?: string;
}

export class RequestResetPasswordDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address to send password reset code',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class VerifyResetCodeDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address associated with the reset code',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit password reset code sent to email',
    pattern: '^\\d{6}$',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Reset code must be 6 digits' })
  @IsNotEmpty()
  otp_code!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user resetting the password',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'New password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsNotEmpty()
  newPassword!: string;
}

export class ValidateRoleChangeDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'MongoDB ObjectId of the user whose role is being changed',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    example: 'INSTRUCTORS_USER',
    description:
      'New role to assign: PENDING, STUDENT_USER, or INSTRUCTORS_USER',
    enum: ['PENDING', 'STUDENT_USER', 'INSTRUCTORS_USER'],
  })
  @IsString()
  @IsNotEmpty()
  newRole!: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description:
      'MongoDB ObjectId of the owner user performing the role change',
  })
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;
}
