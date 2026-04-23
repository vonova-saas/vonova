import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'The file to upload (supports PDF, DOC, DOCX, PPT, PPTX, etc.)',
    example: 'book.pdf',
  })
  file: Express.Multer.File;
}

export class UploadQueryDto {
  @ApiProperty({
    description: 'Type of item to upload file for',
    enum: ['book', 'presentation', 'guide'],
    example: 'book',
    required: true,
  })
  itemType: 'book' | 'presentation' | 'guide';

  @ApiProperty({
    description: 'The unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  itemId: string;
}

export class UploadResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Direct S3 URL of the uploaded file',
    example:
      'https://your-library-bucket.s3.amazonaws.com/library/book/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000-book.pdf',
  })
  fileUrl: string;

  @ApiProperty({
    description: 'S3 object key for the uploaded file',
    example:
      'library/book/507f1f77bcf86cd799439011/550e8400-e29b-41d4-a716-446655440000-book.pdf',
  })
  objectKey: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Unique asset identifier',
    example: '507f1f77bcf86cd799439015',
  })
  assetId: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'File is required',
  })
  message: string;
}
