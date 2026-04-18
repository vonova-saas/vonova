import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReplyAdminSupportDto {
  @ApiProperty({
    description:
      'Plain-text response from an administrator. Shown to the end user associated with the ticket.',
    example:
      'We reproduced this on our side. A fix will go live tonight; we will email you when it is deployed.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  adminReply: string;
}
