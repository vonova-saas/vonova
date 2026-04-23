import { ApiProperty } from '@nestjs/swagger';

export class MaterialBreakdownDto {
  @ApiProperty({
    description: 'Count of materials',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total materials',
    example: '45.45',
  })
  percentage: string;
}

export class TotalMaterialsResponseDto {
  @ApiProperty({
    description: 'Total count of all materials',
    example: 55,
  })
  total: number;

  @ApiProperty({
    description: 'Total count of books',
    example: 25,
  })
  books: number;

  @ApiProperty({
    description: 'Total count of guides',
    example: 20,
  })
  guides: number;

  @ApiProperty({
    description: 'Total count of presentations',
    example: 10,
  })
  presentations: number;

  @ApiProperty({
    description: 'Detailed breakdown with percentages',
  })
  breakdown: {
    books: MaterialBreakdownDto;
    guides: MaterialBreakdownDto;
    presentations: MaterialBreakdownDto;
  };
}
