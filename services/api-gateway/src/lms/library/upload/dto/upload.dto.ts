import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignDto {
  @ApiProperty({
    description: 'Original filename of the file being uploaded',
    example: 'javascript-guide.pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 1024000,
    minimum: 1,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  size: number;
}

export class CompleteDto {
  @ApiProperty({
    description: 'Unique identifier for the uploaded asset',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({
    description: 'Object key for the uploaded file in storage',
    example: 'uploads/2023/javascript-guide.pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  objectKey: string;
}
